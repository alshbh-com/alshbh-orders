import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart, Star, ChevronRight, Share2, MessageCircle, Minus, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const COLORS: Record<string, string> = {
  "أسود": "#000000",
  "أبيض": "#FFFFFF",
  "أحمر": "#EF4444",
  "أزرق": "#3B82F6",
  "أخضر": "#22C55E",
  "رمادي": "#6B7280",
};

interface CartItem {
  product: any;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export default function ProductDetail() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // Review
  const [showReview, setShowReview] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Direct buy
  const [showBuy, setShowBuy] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [slug, productId]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data: storeData } = await supabase
      .from("stores").select("*").eq("store_slug", slug).eq("is_active", true).maybeSingle();

    if (!storeData) { setLoading(false); return; }
    setStore(storeData);

    const { data: productData } = await supabase
      .from("products").select("*").eq("id", productId).eq("store_id", storeData.id).eq("is_active", true).maybeSingle();

    if (!productData) { setLoading(false); return; }
    setProduct(productData);

    const [imagesRes, variantsRes, reviewsRes, relatedRes] = await Promise.all([
      supabase.from("product_images").select("*").eq("product_id", productData.id).order("sort_order"),
      supabase.from("product_variants").select("*").eq("product_id", productData.id),
      supabase.from("reviews").select("*").eq("product_id", productData.id).order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("store_id", storeData.id).eq("is_active", true).neq("id", productData.id)
        .eq("category_id", productData.category_id || "").limit(4),
    ]);

    const allImages = [productData.main_image_url, ...(imagesRes.data?.map(i => i.image_url) || [])].filter(Boolean);
    setImages(allImages);
    setVariants(variantsRes.data || []);
    setReviews(reviewsRes.data || []);
    setRelatedProducts(relatedRes.data || []);

    // Pre-select first available size/color from variants
    const availableSizes = [...new Set((variantsRes.data || []).map(v => v.size).filter(Boolean))];
    const availableColors = [...new Set((variantsRes.data || []).map(v => v.color).filter(Boolean))];
    if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
    if (availableColors.length > 0) setSelectedColor(availableColors[0]);

    setLoading(false);
  };

  const availableSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const availableColors = [...new Set(variants.map(v => v.color).filter(Boolean))];

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const finalPrice = product?.discount_price || product?.price || 0;
  const hasDiscount = product?.discount_price && product.discount_price < product.price;
  const shippingCost = store?.shipping_cost || 70;

  const addToCartAndGo = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      toast({ title: "اختار المقاس الأول", variant: "destructive" });
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      toast({ title: "اختار اللون الأول", variant: "destructive" });
      return;
    }

    // Save to localStorage cart for the store
    const cartKey = `cart_${store.id}`;
    const existing: CartItem[] = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const cartItem: CartItem = { product, quantity, selectedSize, selectedColor };

    const existingIdx = existing.findIndex(
      i => i.product.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor
    );
    if (existingIdx >= 0) {
      existing[existingIdx].quantity += quantity;
    } else {
      existing.push(cartItem);
    }
    localStorage.setItem(cartKey, JSON.stringify(existing));

    toast({ title: "تم الإضافة للسلة ✅", description: `${product.name} - ${quantity} قطعة` });
    navigate(`/store/${slug}`);
  };

  const directBuy = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast({ title: "اكتب كل البيانات", variant: "destructive" });
      return;
    }
    if (store.points_balance <= 0) {
      toast({ title: "المتجر مش بيستقبل طلبات دلوقتي", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const totalPrice = finalPrice * quantity + shippingCost;
      const { data: order, error } = await supabase.from("orders").insert({
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_notes: customerNotes || null,
        total_price: totalPrice,
        shipping_cost: shippingCost,
      }).select().single();
      if (error) throw error;

      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        quantity,
        price: finalPrice,
        selected_size: selectedSize || null,
        selected_color: selectedColor || null,
      });

      setOrderSuccess(order.id);
      setShowBuy(false);
    } catch (e: any) {
      toast({ title: "حصل مشكلة", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitReview = async () => {
    if (!reviewName || !reviewRating) return;
    await supabase.from("reviews").insert({
      product_id: product.id,
      customer_name: reviewName,
      rating: reviewRating,
      comment: reviewComment || null,
    });
    toast({ title: "شكراً لتقييمك! ⭐" });
    setShowReview(false);
    setReviewName(""); setReviewRating(5); setReviewComment("");
    fetchProduct();
  };

  const shareProduct = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product?.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "تم نسخ الرابط 📋" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">المنتج مش موجود</h1>
        <Button onClick={() => navigate(`/store/${slug}`)}>ارجع للمتجر</Button>
      </div>
    );
  }

  // Order success page
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold">تم تسجيل طلبك بنجاح!</h1>
          <p className="text-muted-foreground">رقم الطلب: <span className="font-mono font-bold">{orderSuccess.slice(0, 8)}</span></p>
          <p className="text-muted-foreground">هيتم التواصل معاك قريب على الواتساب أو التليفون</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate(`/store/${slug}`)}>ارجع للمتجر</Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`مرحباً، أنا عملت طلب رقم ${orderSuccess.slice(0, 8)}`)}`} target="_blank">
                <Button variant="outline"><MessageCircle className="h-4 w-4 ml-1" />تواصل واتساب</Button>
              </a>
            )}
          </div>
          <AlshbhWatermark />
        </div>
      </div>
    );
  }

  const storeStyle = {
    "--store-primary": store.primary_color || "#D97706",
    "--store-secondary": store.secondary_color || "#F59E0B",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex flex-col" style={storeStyle}>
      {/* Header */}
      <header className="text-white py-3" style={{ background: `linear-gradient(to left, ${store.primary_color}, ${store.secondary_color})` }}>
        <div className="container flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate(`/store/${slug}`)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            {store.logo_url && <img src={store.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />}
            <span className="font-bold">{store.store_name}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={shareProduct}>
              <Share2 className="h-5 w-5" />
            </Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container py-4 pb-24">
        {/* Images */}
        <div className="mb-6">
          {images.length > 0 ? (
            <>
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-72 sm:h-96 object-cover rounded-xl mb-3"
              />
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-72 bg-muted rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4 mb-6">
          <h1 className="text-2xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: "var(--store-primary)" }}>{finalPrice} جنيه</span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">{product.price} جنيه</span>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs">
                خصم {Math.round((1 - product.discount_price / product.price) * 100)}%
              </Badge>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Rating */}
          {avgRating && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                ))}
              </div>
              <span className="text-sm font-semibold">{avgRating}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} تقييم)</span>
            </div>
          )}

          {/* Stock */}
          {product.stock !== null && (
            <div className="flex items-center gap-2">
              <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                {product.stock > 0 ? `متوفر - ${product.stock} قطعة` : "غير متوفر"}
              </Badge>
            </div>
          )}

          {/* Shipping */}
          <p className="text-sm text-muted-foreground">🚚 التوصيل: {shippingCost} جنيه لكل المحافظات</p>
        </div>

        {/* Size Selection */}
        {availableSizes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">المقاس</h3>
            <div className="flex gap-2 flex-wrap">
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection */}
        {availableColors.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">اللون</h3>
            <div className="flex gap-3 flex-wrap">
              {availableColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                    selectedColor === color
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-border"
                    style={{ backgroundColor: COLORS[color] || "#888" }}
                  />
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">الكمية</h3>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold w-12 text-center">{quantity}</span>
            <Button size="icon" variant="outline" onClick={() => setQuantity(quantity + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">التقييمات ({reviews.length})</h3>
            <Button size="sm" variant="outline" onClick={() => setShowReview(true)}>⭐ قيّم المنتج</Button>
          </div>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">مفيش تقييمات لسه — كن أول واحد يقيّم!</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.customer_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">منتجات مشابهة</h3>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map(p => (
                <div key={p.id} className="border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/store/${slug}/product/${p.id}`)}>
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-32 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center"><ShoppingCart className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                  <div className="p-2">
                    <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                    <span className="text-sm font-bold" style={{ color: "var(--store-primary)" }}>
                      {p.discount_price || p.price} جنيه
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border p-3 z-50">
        <div className="container flex gap-2">
          <Button className="flex-1 text-base h-12" onClick={addToCartAndGo}>
            <ShoppingCart className="h-5 w-5 ml-2" />
            أضف للسلة
          </Button>
          <Button variant="outline" className="flex-1 text-base h-12" onClick={() => setShowBuy(true)}>
            اشتري دلوقتي
          </Button>
        </div>
      </div>

      {/* Direct Buy Dialog */}
      <Dialog open={showBuy} onOpenChange={setShowBuy}>
        <DialogContent>
          <DialogHeader><DialogTitle>شراء مباشر</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-semibold">{product.name} × {quantity}</p>
              {selectedSize && <p>المقاس: {selectedSize}</p>}
              {selectedColor && <p>اللون: {selectedColor}</p>}
              <p className="font-bold mt-1">المنتج: {finalPrice * quantity} جنيه</p>
              <p>التوصيل: {shippingCost} جنيه</p>
              <p className="text-base font-bold mt-1 border-t pt-1">الإجمالي: {finalPrice * quantity + shippingCost} جنيه</p>
            </div>
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اسمك بالكامل" />
            </div>
            <div className="space-y-2">
              <Label>رقم الموبايل</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="العنوان بالتفصيل" />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="أي ملاحظات..." />
            </div>
            <Button className="w-full" onClick={directBuy} disabled={submitting}>
              {submitting ? "جاري التسجيل..." : "تأكيد الطلب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader><DialogTitle>قيّم المنتج ⭐</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسمك</Label>
              <Input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="اسمك" />
            </div>
            <div className="space-y-2">
              <Label>التقييم</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star className={`h-8 w-8 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>تعليق (اختياري)</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="رأيك في المنتج..." />
            </div>
            <Button className="w-full" onClick={submitReview}>إرسال التقييم</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlshbhWatermark />
    </div>
  );
}
