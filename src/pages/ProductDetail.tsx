import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart, Star, Share2, MessageCircle, Minus, Plus, ArrowRight, MapPin, Trash2, Copy } from "lucide-react";
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

    // Track page view
    const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
    localStorage.setItem('visitor_id', visitorId);
    supabase.from("page_views").insert({
      store_id: storeData.id,
      page_path: `/store/${slug}/product/${productId}`,
      visitor_id: visitorId,
    }).then(() => {});

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

  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareProduct = () => {
    setShowShareMenu(true);
  };

  const shareVia = (platform: string) => {
    const url = window.location.href;
    const text = encodeURIComponent(`${product?.name} — شوف المنتج ده! 🔥`);
    const encodedUrl = encodeURIComponent(url);
    switch (platform) {
      case 'whatsapp': window.open(`https://wa.me/?text=${text}%20${encodedUrl}`, '_blank'); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank'); break;
      case 'telegram': window.open(`https://t.me/share/url?url=${encodedUrl}&text=${text}`, '_blank'); break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({ title: "تم نسخ الرابط يسطا! 📋" });
        break;
    }
    setShowShareMenu(false);
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

        {/* ===== VARIANT SELECTION - Improved ===== */}
        <div className="mb-6 space-y-3">
          {hasVariants && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">اختار اللي عايزه 👇</h3>
                <Badge variant="secondary" className="text-sm px-3 py-1">{totalQuantity} قطعة</Badge>
              </div>

              {selections.map((sel, idx) => (
                <div key={idx} className="relative bg-muted/40 rounded-2xl p-4 space-y-4 border border-border/50">
                  {selections.length > 1 && (
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-bold">اختيار {idx + 1}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeSelection(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Size chips - bigger & clearer */}
                  {availableSizes.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">👕 المقاس</p>
                      <div className="flex gap-2 flex-wrap">
                        {availableSizes.map(size => (
                          <button key={size} onClick={() => updateSelection(idx, 'size', size)}
                            className={`min-w-[3rem] px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                              sel.size === size
                                ? "text-white shadow-lg scale-105"
                                : "border-2 border-border bg-background hover:border-primary/50 hover:scale-105"
                            }`}
                            style={sel.size === size ? { backgroundColor: store.primary_color || '#D97706', borderColor: store.primary_color || '#D97706' } : {}}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color chips - bigger with color preview */}
                  {availableColors.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">🎨 اللون</p>
                      <div className="flex gap-2 flex-wrap">
                        {availableColors.map(color => (
                          <button key={color} onClick={() => updateSelection(idx, 'color', color)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              sel.color === color
                                ? "ring-2 ring-offset-2 shadow-lg scale-105"
                                : "border-2 border-border bg-background hover:border-primary/50 hover:scale-105"
                            }`}
                            style={sel.color === color ? { borderColor: store.primary_color } : {}}>
                            <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: COLORS[color] || "#888" }} />
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity - improved */}
                  <div>
                    <p className="text-sm font-semibold mb-2">🔢 الكمية</p>
                    <div className="flex items-center gap-3 bg-background rounded-xl p-2 w-fit border border-border">
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-destructive/10" onClick={() => updateSelection(idx, 'quantity', Math.max(1, sel.quantity - 1))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-bold w-10 text-center">{sel.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={() => updateSelection(idx, 'quantity', sel.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add another variant button */}
              <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed border-2 h-11 text-sm font-semibold" onClick={addSelection}>
                <Plus className="h-4 w-4 ml-1" />
                عايز مقاس/لون تاني؟ ضيف كمان! ➕
              </Button>
            </div>
          )}

          {/* No variants - just quantity */}
          {!hasVariants && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-lg mb-3">كام قطعة عايز؟ 🔢</h3>
              <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-2 w-fit border border-border">
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-destructive/10" onClick={() => updateSelection(0, 'quantity', Math.max(1, selections[0].quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">{selections[0].quantity}</span>
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={() => updateSelection(0, 'quantity', selections[0].quantity + 1)}>
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

      {/* Share Menu Dialog */}
      <Dialog open={showShareMenu} onOpenChange={setShowShareMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>شارك المنتج 📤</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2 h-12 hover:bg-green-500/10 hover:border-green-500" onClick={() => shareVia('whatsapp')}>
              <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              واتساب
            </Button>
            <Button variant="outline" className="gap-2 h-12 hover:bg-blue-500/10 hover:border-blue-500" onClick={() => shareVia('facebook')}>
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              فيسبوك
            </Button>
            <Button variant="outline" className="gap-2 h-12 hover:bg-sky-500/10 hover:border-sky-500" onClick={() => shareVia('twitter')}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              تويتر / X
            </Button>
            <Button variant="outline" className="gap-2 h-12 hover:bg-blue-400/10 hover:border-blue-400" onClick={() => shareVia('telegram')}>
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              تليجرام
            </Button>
          </div>
          <Button variant="outline" className="w-full gap-2 mt-1" onClick={() => shareVia('copy')}>
            <Copy className="h-4 w-4" />
            انسخ الرابط 📋
          </Button>
        </DialogContent>
      </Dialog>

      <AlshbhWatermark />
    </div>
  );
}
