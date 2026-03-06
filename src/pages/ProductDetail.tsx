import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart, Star, Share2, MessageCircle, Minus, Plus, ArrowRight, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface VariantSelection {
  size?: string;
  color?: string;
  quantity: number;
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
  const [storeShipping, setStoreShipping] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selections, setSelections] = useState<VariantSelection[]>([{ quantity: 1 }]);

  const [showReview, setShowReview] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [showBuy, setShowBuy] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => { fetchProduct(); }, [slug, productId]);

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

    const [imagesRes, variantsRes, reviewsRes, relatedRes, shippingRes] = await Promise.all([
      supabase.from("product_images").select("*").eq("product_id", productData.id).order("sort_order"),
      supabase.from("product_variants").select("*").eq("product_id", productData.id),
      supabase.from("reviews").select("*").eq("product_id", productData.id).order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("store_id", storeData.id).eq("is_active", true).neq("id", productData.id)
        .eq("category_id", productData.category_id || "").limit(4),
      supabase.from("store_shipping").select("*").eq("store_id", storeData.id).eq("is_active", true),
    ]);

    const allImages = [productData.main_image_url, ...(imagesRes.data?.map(i => i.image_url) || [])].filter(Boolean);
    setImages(allImages);
    setVariants(variantsRes.data || []);
    setReviews(reviewsRes.data || []);
    setRelatedProducts(relatedRes.data || []);
    setStoreShipping(shippingRes.data || []);

    const avSizes = [...new Set((variantsRes.data || []).map(v => v.size).filter(Boolean))];
    const avColors = [...new Set((variantsRes.data || []).map(v => v.color).filter(Boolean))];
    setSelections([{ size: avSizes[0], color: avColors[0], quantity: 1 }]);
    setLoading(false);
  };

  const availableSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const availableColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  const hasVariants = availableSizes.length > 0 || availableColors.length > 0;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const finalPrice = product?.discount_price || product?.price || 0;
  const hasDiscount = product?.discount_price && product.discount_price < product.price;

  const totalQuantity = selections.reduce((s, sel) => s + sel.quantity, 0);

  const getShippingCost = () => {
    if (selectedGovernorate && storeShipping.length > 0) {
      const found = storeShipping.find(s => s.governorate === selectedGovernorate);
      return found ? Number(found.shipping_cost) : (store?.shipping_cost || 70);
    }
    return store?.shipping_cost || 70;
  };
  const shippingCost = getShippingCost();

  // Selection helpers
  const updateSelection = (index: number, field: keyof VariantSelection, value: any) => {
    setSelections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSelection = () => {
    setSelections(prev => [...prev, { size: availableSizes[0], color: availableColors[0], quantity: 1 }]);
  };

  const removeSelection = (index: number) => {
    if (selections.length <= 1) return;
    setSelections(prev => prev.filter((_, i) => i !== index));
  };

  const addToCartAndGo = () => {
    for (const sel of selections) {
      if (availableSizes.length > 0 && !sel.size) {
        toast({ title: "اختار المقاس لكل الاختيارات يسطا! 👕", variant: "destructive" });
        return;
      }
      if (availableColors.length > 0 && !sel.color) {
        toast({ title: "اختار اللون لكل الاختيارات يا اخويا! 🎨", variant: "destructive" });
        return;
      }
    }

    const cartKey = `cart_${store.id}`;
    const existing: CartItem[] = JSON.parse(localStorage.getItem(cartKey) || "[]");

    for (const sel of selections) {
      const existingIdx = existing.findIndex(
        i => i.product.id === product.id && i.selectedSize === (sel.size || undefined) && i.selectedColor === (sel.color || undefined)
      );
      if (existingIdx >= 0) {
        existing[existingIdx].quantity += sel.quantity;
      } else {
        existing.push({
          product,
          quantity: sel.quantity,
          selectedSize: sel.size,
          selectedColor: sel.color,
        });
      }
    }

    localStorage.setItem(cartKey, JSON.stringify(existing));
    toast({ title: "حلو! اتضاف في السلة 🛒", description: `${product.name} - ${totalQuantity} قطعة` });
    navigate(`/store/${slug}`);
  };

  const directBuy = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast({ title: "اكتب كل البيانات يسطا! 📝", variant: "destructive" });
      return;
    }
    if (storeShipping.length > 0 && !selectedGovernorate) {
      toast({ title: "اختار المحافظة بتاعتك يا اخويا! 📍", variant: "destructive" });
      return;
    }
    if (store.points_balance <= 0) {
      toast({ title: "المتجر ده واقف دلوقتي يسطا 😕", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const totalPrice = finalPrice * totalQuantity + shippingCost;
      const addressWithGov = selectedGovernorate ? `${selectedGovernorate} - ${customerAddress}` : customerAddress;
      const { data: order, error } = await supabase.from("orders").insert({
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: addressWithGov,
        customer_notes: customerNotes || null,
        total_price: totalPrice,
        shipping_cost: shippingCost,
      }).select().single();
      if (error) throw error;

      const items = selections.map(sel => ({
        order_id: order.id,
        product_id: product.id,
        quantity: sel.quantity,
        price: finalPrice,
        selected_size: sel.size || null,
        selected_color: sel.color || null,
      }));
      await supabase.from("order_items").insert(items);

      setOrderSuccess(order.id);
      setShowBuy(false);
    } catch (e: any) {
      toast({ title: "حصلت مشكلة يسطا 😕", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitReview = async () => {
    if (!reviewName || !reviewRating) return;
    await supabase.from("reviews").insert({
      product_id: product.id, customer_name: reviewName, rating: reviewRating, comment: reviewComment || null,
    });
    toast({ title: "شكراً ليك يسطا! ⭐" });
    setShowReview(false); setReviewName(""); setReviewRating(5); setReviewComment("");
    fetchProduct();
  };

  const shareProduct = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: product?.name, url });
    else { navigator.clipboard.writeText(url); toast({ title: "تم نسخ الرابط يسطا! 📋" }); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!store || !product) return <div className="flex min-h-screen flex-col items-center justify-center gap-4"><Store className="h-16 w-16 text-muted-foreground" /><h1 className="text-2xl font-bold">المنتج ده مش موجود يسطا 😕</h1><Button onClick={() => navigate(`/store/${slug}`)}>يلا ارجع للمتجر</Button></div>;

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold">تمام يسطا! طلبك اتسجل 🔥</h1>
          <p className="text-muted-foreground">رقم الطلب: <span className="font-mono font-bold">{orderSuccess.slice(0, 8)}</span></p>
          <p className="text-muted-foreground">استنى شوية وهنكلمك على الواتساب أو التليفون 📞</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate(`/store/${slug}`)}>يلا ارجع للمتجر 🛍️</Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`ازيك يسطا! أنا عملت طلب رقم ${orderSuccess.slice(0, 8)} 🎉`)}`} target="_blank">
                <Button variant="outline"><MessageCircle className="h-4 w-4 ml-1" />كلمنا واتساب</Button>
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
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={shareProduct}><Share2 className="h-5 w-5" /></Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><MessageCircle className="h-5 w-5" /></Button>
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
              <img src={images[selectedImage]} alt={product.name} className="w-full h-72 sm:h-96 object-cover rounded-xl mb-3" />
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-72 bg-muted rounded-xl flex items-center justify-center"><ShoppingCart className="h-12 w-12 text-muted-foreground" /></div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4 mb-6">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: "var(--store-primary)" }}>{finalPrice} جنيه</span>
            {hasDiscount && <span className="text-lg text-muted-foreground line-through">{product.price} جنيه</span>}
            {hasDiscount && <Badge variant="destructive" className="text-xs">خصم {Math.round((1 - product.discount_price / product.price) * 100)}% 🔥</Badge>}
          </div>
          {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}
          {avgRating && (
            <div className="flex items-center gap-2">
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />)}</div>
              <span className="text-sm font-semibold">{avgRating}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} تقييم)</span>
            </div>
          )}
          {product.stock !== null && <Badge variant={product.stock > 0 ? "default" : "destructive"}>{product.stock > 0 ? `متوفر ✅ ${product.stock} قطعة` : "خلص يسطا 😅"}</Badge>}
          <p className="text-sm text-muted-foreground">🚚 التوصيل لكل محافظات مصر — السعر حسب محافظتك</p>
        </div>

        {/* ===== VARIANT SELECTION - Super Simple ===== */}
        <div className="mb-6 space-y-3">
          {hasVariants && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">اختار اللي عايزه 👇</h3>
                {selections.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{totalQuantity} قطعة</Badge>
                )}
              </div>

              {selections.map((sel, idx) => (
                <div key={idx} className="relative bg-muted/50 rounded-xl p-3 space-y-3">
                  {selections.length > 1 && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-muted-foreground">اختيار {idx + 1}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeSelection(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Size chips */}
                  {availableSizes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">👕 المقاس</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {availableSizes.map(size => (
                          <button key={size} onClick={() => updateSelection(idx, 'size', size)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              sel.size === size
                                ? "text-white shadow-md"
                                : "border border-border bg-background hover:border-primary/50"
                            }`}
                            style={sel.size === size ? { backgroundColor: store.primary_color || '#D97706' } : {}}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color chips */}
                  {availableColors.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">🎨 اللون</p>
                      <div className="flex gap-2 flex-wrap">
                        {availableColors.map(color => (
                          <button key={color} onClick={() => updateSelection(idx, 'color', color)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                              sel.color === color ? "ring-2 ring-offset-1 border-primary" : "border border-border bg-background hover:border-primary/50"
                            }`}
                            style={sel.color === color ? { borderColor: store.primary_color } : {}}>
                            <span className="w-4 h-4 rounded-full border border-border shrink-0" style={{ backgroundColor: COLORS[color] || "#888" }} />
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">🔢 الكمية</p>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateSelection(idx, 'quantity', Math.max(1, sel.quantity - 1))}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-lg font-bold w-8 text-center">{sel.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateSelection(idx, 'quantity', sel.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add another variant button */}
              <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed" onClick={addSelection}>
                <Plus className="h-4 w-4 ml-1" />
                عايز مقاس/لون تاني؟ ضيف كمان! ➕
              </Button>
            </div>
          )}

          {/* No variants - just quantity */}
          {!hasVariants && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-base mb-3">كام قطعة عايز؟ 🔢</h3>
              <div className="flex items-center gap-3">
                <Button size="icon" variant="outline" className="rounded-full" onClick={() => updateSelection(0, 'quantity', Math.max(1, selections[0].quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">{selections[0].quantity}</span>
                <Button size="icon" variant="outline" className="rounded-full" onClick={() => updateSelection(0, 'quantity', selections[0].quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">الناس بتقول إيه؟ 💬 ({reviews.length})</h3>
            <Button size="sm" variant="outline" onClick={() => setShowReview(true)}>⭐ قيّم المنتج</Button>
          </div>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">مفيش تقييمات لسه — كن أول واحد يقيّم يسطا! 🌟</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.customer_name}</span>
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />)}</div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">ممكن يعجبك كمان 😍</h3>
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
                    <span className="text-sm font-bold" style={{ color: "var(--store-primary)" }}>{p.discount_price || p.price} جنيه</span>
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
            حطه في السلة ({totalQuantity}) 🛒
          </Button>
          <Button variant="outline" className="flex-1 text-base h-12" onClick={() => setShowBuy(true)}>
            اشتري دلوقتي 🔥
          </Button>
        </div>
      </div>

      {/* Direct Buy Dialog */}
      <Dialog open={showBuy} onOpenChange={setShowBuy}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>يلا نشتري! 🎉</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <p className="font-semibold">{product.name}</p>
              {selections.map((sel, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>• {sel.quantity} قطعة</span>
                  {sel.size && <span>— مقاس {sel.size}</span>}
                  {sel.color && <span>— {sel.color}</span>}
                </div>
              ))}
              <p className="font-bold mt-1">المنتج: {finalPrice * totalQuantity} جنيه</p>
              <p>التوصيل: {shippingCost} جنيه {selectedGovernorate && `(${selectedGovernorate})`}</p>
              <p className="text-base font-bold mt-1 border-t pt-1">الإجمالي: {finalPrice * totalQuantity + shippingCost} جنيه</p>
            </div>
            <div className="space-y-2">
              <Label>اسمك إيه يا اخويا؟ 😊</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="محمد أحمد" />
            </div>
            <div className="space-y-2">
              <Label>رقم موبايلك 📱</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
            {storeShipping.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" />محافظتك إيه؟ 📍</Label>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger><SelectValue placeholder="اختار المحافظة..." /></SelectTrigger>
                  <SelectContent>
                    {storeShipping.map(s => <SelectItem key={s.id} value={s.governorate}>{s.governorate} — {s.shipping_cost} جنيه توصيل</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>عنوانك بالتفصيل 🏠</Label>
              <Textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="الشارع والعمارة والشقة..." />
            </div>
            <div className="space-y-2">
              <Label>عايز تقولنا حاجة؟ (اختياري)</Label>
              <Input value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="مثلاً: عايزه يتلف كويس 🎁" />
            </div>
            <Button className="w-full" onClick={directBuy} disabled={submitting}>
              {submitting ? "ثانية يسطا... ⏳" : "أكد الطلب 🎉"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader><DialogTitle>قولنا رأيك يسطا! ⭐</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسمك</Label><Input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="اسمك إيه؟" /></div>
            <div className="space-y-2">
              <Label>التقييم</Label>
              <div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewRating(s)}><Star className={`h-8 w-8 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} /></button>)}</div>
            </div>
            <div className="space-y-2"><Label>عايز تقول حاجة تانية؟ (اختياري)</Label><Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="رأيك في المنتج يسطا..." /></div>
            <Button className="w-full" onClick={submitReview}>ابعت التقييم ⭐</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlshbhWatermark />
    </div>
  );
}
