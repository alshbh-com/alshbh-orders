import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart, Star, Share2, MessageCircle, Minus, Plus, ArrowRight, MapPin, Trash2, Copy, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS: Record<string, string> = {
  "أسود": "#000000", "أبيض": "#FFFFFF", "أحمر": "#EF4444", "أزرق": "#3B82F6", "أخضر": "#22C55E", "رمادي": "#6B7280",
};

interface CartItem { product: any; quantity: number; selectedSize?: string; selectedColor?: string; }
interface VariantSelection { size?: string; color?: string; quantity: number; }

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
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => { fetchProduct(); }, [slug, productId]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data: storeData } = await supabase.from("stores").select("*").eq("store_slug", slug).eq("is_active", true).maybeSingle();
    if (!storeData) { setLoading(false); return; }
    setStore(storeData);
    const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
    localStorage.setItem('visitor_id', visitorId);
    (supabase as any).from("page_views").insert({ store_id: storeData.id, page_path: `/store/${slug}/product/${productId}`, visitor_id: visitorId }).then(() => {});

    const { data: productData } = await supabase.from("products").select("*").eq("id", productId).eq("store_id", storeData.id).eq("is_active", true).maybeSingle();
    if (!productData) { setLoading(false); return; }
    setProduct(productData);

    const [imagesRes, variantsRes, reviewsRes, relatedRes, shippingRes] = await Promise.all([
      supabase.from("product_images").select("*").eq("product_id", productData.id).order("sort_order"),
      supabase.from("product_variants").select("*").eq("product_id", productData.id),
      supabase.from("reviews").select("*").eq("product_id", productData.id).order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("store_id", storeData.id).eq("is_active", true).neq("id", productData.id).eq("category_id", productData.category_id || "").limit(4),
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

  const updateSelection = (index: number, field: keyof VariantSelection, value: any) => {
    setSelections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };
  const addSelection = () => setSelections(prev => [...prev, { size: availableSizes[0], color: availableColors[0], quantity: 1 }]);
  const removeSelection = (index: number) => { if (selections.length <= 1) return; setSelections(prev => prev.filter((_, i) => i !== index)); };

  const addToCartAndGo = () => {
    for (const sel of selections) {
      if (availableSizes.length > 0 && !sel.size) { toast({ title: "اختر المقاس لكل الاختيارات", variant: "destructive" }); return; }
      if (availableColors.length > 0 && !sel.color) { toast({ title: "اختر اللون لكل الاختيارات", variant: "destructive" }); return; }
    }
    const cartKey = `cart_${store.id}`;
    const existing: CartItem[] = JSON.parse(localStorage.getItem(cartKey) || "[]");
    for (const sel of selections) {
      const existingIdx = existing.findIndex(i => i.product.id === product.id && i.selectedSize === (sel.size || undefined) && i.selectedColor === (sel.color || undefined));
      if (existingIdx >= 0) existing[existingIdx].quantity += sel.quantity;
      else existing.push({ product, quantity: sel.quantity, selectedSize: sel.size, selectedColor: sel.color });
    }
    localStorage.setItem(cartKey, JSON.stringify(existing));
    toast({ title: "تمت الإضافة للسلة ✓", description: `${product.name} — ${totalQuantity} قطعة` });
    navigate(`/store/${slug}`);
  };

  const directBuy = async () => {
    if (!customerName || !customerPhone || !customerAddress) { toast({ title: "يرجى إكمال جميع البيانات", variant: "destructive" }); return; }
    if (storeShipping.length > 0 && !selectedGovernorate) { toast({ title: "يرجى اختيار المحافظة", variant: "destructive" }); return; }
    if (store.points_balance <= 0) { toast({ title: "المتجر متوقف مؤقتاً", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const totalPrice = finalPrice * totalQuantity + shippingCost;
      const addressWithGov = selectedGovernorate ? `${selectedGovernorate} - ${customerAddress}` : customerAddress;
      const { data: order, error } = await supabase.from("orders").insert({ store_id: store.id, customer_name: customerName, customer_phone: customerPhone, customer_address: addressWithGov, customer_notes: customerNotes || null, total_price: totalPrice, shipping_cost: shippingCost }).select().single();
      if (error) throw error;
      const items = selections.map(sel => ({ order_id: order.id, product_id: product.id, quantity: sel.quantity, price: finalPrice, selected_size: sel.size || null, selected_color: sel.color || null }));
      await supabase.from("order_items").insert(items);
      setOrderSuccess(order.id); setShowBuy(false);
    } catch (e: any) { toast({ title: "حدث خطأ", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  const submitReview = async () => {
    if (!reviewName || !reviewRating) return;
    await supabase.from("reviews").insert({ product_id: product.id, customer_name: reviewName, rating: reviewRating, comment: reviewComment || null });
    toast({ title: "شكراً لتقييمك ⭐" });
    setShowReview(false); setReviewName(""); setReviewRating(5); setReviewComment(""); fetchProduct();
  };

  const shareVia = (platform: string) => {
    const url = window.location.href;
    const text = encodeURIComponent(`${product?.name} — شوف المنتج ده!`);
    const encodedUrl = encodeURIComponent(url);
    switch (platform) {
      case 'whatsapp': window.open(`https://wa.me/?text=${text}%20${encodedUrl}`, '_blank'); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank'); break;
      case 'telegram': window.open(`https://t.me/share/url?url=${encodedUrl}&text=${text}`, '_blank'); break;
      case 'copy': navigator.clipboard.writeText(url); toast({ title: "تم نسخ الرابط ✓" }); break;
    }
    setShowShareMenu(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}><div className="h-10 w-10 animate-spin rounded-full border-3" style={{ borderColor: '#e9ecef', borderTopColor: '#6c757d' }} /></div>;
  if (!store || !product) return <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ backgroundColor: '#f8f9fa' }}><Store className="h-14 w-14" style={{ color: '#adb5bd' }} /><h1 className="text-xl font-bold" style={{ color: '#343a40' }}>المنتج غير موجود</h1><button onClick={() => navigate(`/store/${slug}`)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#495057' }}>العودة للمتجر</button></div>;

  const pc = store.primary_color || "#4f46e5";
  const sc = store.secondary_color || "#7c3aed";

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center max-w-sm space-y-6 bg-white rounded-2xl p-8 shadow-sm">
          <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#d4edda' }}>
            <svg className="h-10 w-10" style={{ color: '#28a745' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#212529' }}>تم تأكيد طلبك بنجاح!</h1>
          <p className="text-sm" style={{ color: '#6c757d' }}>رقم الطلب: <span className="font-mono font-bold" style={{ color: '#212529' }}>{orderSuccess.slice(0, 8).toUpperCase()}</span></p>
          <p className="text-sm" style={{ color: '#6c757d' }}>سيتم التواصل معك قريباً</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(`/store/${slug}`)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 hover:bg-gray-50" style={{ borderColor: '#dee2e6', color: '#495057' }}>العودة للمتجر</button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`مرحباً، طلبي رقم ${orderSuccess.slice(0, 8)}`)}`} target="_blank">
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#25D366' }}>تواصل واتساب</button>
              </a>
            )}
          </div>
          <AlshbhWatermark />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(`/store/${slug}`)} className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ArrowRight className="h-5 w-5" style={{ color: '#343a40' }} />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            {store.logo_url && <img src={store.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />}
            <span className="font-bold text-sm" style={{ color: '#212529' }}>{store.store_name}</span>
          </div>
          <button onClick={() => setShowShareMenu(true)} className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Share2 className="h-4.5 w-4.5" style={{ color: '#495057' }} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full pb-28">
        {/* Images */}
        <div className="bg-white">
          {images.length > 0 ? (
            <>
              <img src={images[selectedImage]} alt={product.name} className="w-full aspect-square object-cover" />
              {images.length > 1 && (
                <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all" style={{ borderColor: i === selectedImage ? pc : '#e9ecef' }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: '#f1f3f5' }}>
              <Package className="h-16 w-16" style={{ color: '#dee2e6' }} />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white mt-2 px-5 py-5 space-y-4">
          <h1 className="text-xl font-bold leading-snug" style={{ color: '#212529' }}>{product.name}</h1>
          
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-bold" style={{ color: pc }}>{finalPrice} جنيه</span>
            {hasDiscount && <span className="text-base line-through" style={{ color: '#adb5bd' }}>{product.price} جنيه</span>}
            {hasDiscount && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: '#dc3545' }}>
                خصم {Math.round((1 - product.discount_price / product.price) * 100)}%
              </span>
            )}
          </div>

          {avgRating && (
            <div className="flex items-center gap-2">
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</div>
              <span className="text-sm font-semibold" style={{ color: '#495057' }}>{avgRating}</span>
              <span className="text-sm" style={{ color: '#6c757d' }}>({reviews.length} تقييم)</span>
            </div>
          )}

          {product.description && <p className="text-sm leading-relaxed" style={{ color: '#6c757d' }}>{product.description}</p>}

          {product.stock !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={product.stock > 0 ? { backgroundColor: '#d1e7dd', color: '#0f5132' } : { backgroundColor: '#f8d7da', color: '#842029' }}>
                {product.stock > 0 ? `متوفر — ${product.stock} قطعة` : "نفذت الكمية"}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm" style={{ color: '#6c757d' }}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e9ecef' }}>
              <MapPin className="h-4 w-4" style={{ color: '#495057' }} />
            </div>
            <span>التوصيل لجميع المحافظات — السعر حسب محافظتك</span>
          </div>
        </div>

        {/* Variants */}
        {hasVariants && (
          <div className="bg-white mt-2 px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: '#212529' }}>اختر المواصفات</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${pc}15`, color: pc }}>{totalQuantity} قطعة</span>
            </div>

            {selections.map((sel, idx) => (
              <div key={idx} className="relative rounded-2xl p-4 space-y-4" style={{ backgroundColor: '#f8f9fa', border: '1.5px solid #e9ecef' }}>
                {selections.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>اختيار {idx + 1}</span>
                    <button onClick={() => removeSelection(idx)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" style={{ color: '#dc3545' }} />
                    </button>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2.5" style={{ color: '#343a40' }}>المقاس</p>
                    <div className="flex gap-2 flex-wrap">
                      {availableSizes.map(size => (
                        <button key={size} onClick={() => updateSelection(idx, 'size', size)}
                          className="min-w-[3rem] px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                          style={sel.size === size ? { backgroundColor: pc, color: 'white', boxShadow: `0 4px 14px ${pc}40` } : { backgroundColor: 'white', color: '#495057', border: '1.5px solid #dee2e6' }}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2.5" style={{ color: '#343a40' }}>اللون</p>
                    <div className="flex gap-2 flex-wrap">
                      {availableColors.map(color => (
                        <button key={color} onClick={() => updateSelection(idx, 'color', color)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                          style={sel.color === color ? { backgroundColor: 'white', border: `2px solid ${pc}`, boxShadow: `0 4px 14px ${pc}30` } : { backgroundColor: 'white', color: '#495057', border: '1.5px solid #dee2e6' }}>
                          <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: COLORS[color] || "#888" }} />
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold mb-2.5" style={{ color: '#343a40' }}>الكمية</p>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 w-fit" style={{ border: '1.5px solid #e9ecef' }}>
                    <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-gray-100" onClick={() => updateSelection(idx, 'quantity', Math.max(1, sel.quantity - 1))}>
                      <Minus className="h-4 w-4" style={{ color: '#495057' }} />
                    </button>
                    <span className="text-lg font-bold w-8 text-center" style={{ color: '#212529' }}>{sel.quantity}</span>
                    <button className="h-9 w-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: pc }} onClick={() => updateSelection(idx, 'quantity', sel.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addSelection} className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors hover:bg-gray-50" style={{ borderColor: '#ced4da', color: '#6c757d' }}>
              <Plus className="h-4 w-4 inline ml-1" />
              إضافة مقاس/لون آخر
            </button>
          </div>
        )}

        {/* No variants — quantity only */}
        {!hasVariants && (
          <div className="bg-white mt-2 px-5 py-5">
            <h3 className="text-base font-bold mb-3" style={{ color: '#212529' }}>الكمية</h3>
            <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 w-fit" style={{ border: '1.5px solid #e9ecef' }}>
              <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-gray-100" onClick={() => updateSelection(0, 'quantity', Math.max(1, selections[0].quantity - 1))}>
                <Minus className="h-4 w-4" style={{ color: '#495057' }} />
              </button>
              <span className="text-lg font-bold w-10 text-center" style={{ color: '#212529' }}>{selections[0].quantity}</span>
              <button className="h-9 w-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: pc }} onClick={() => updateSelection(0, 'quantity', selections[0].quantity + 1)}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white mt-2 px-5 py-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold" style={{ color: '#212529' }}>التقييمات ({reviews.length})</h3>
            <button onClick={() => setShowReview(true)} className="text-sm font-semibold px-4 py-2 rounded-xl border-2 hover:bg-gray-50" style={{ borderColor: '#dee2e6', color: '#495057' }}>أضف تقييم ⭐</button>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm" style={{ color: '#6c757d' }}>لا توجد تقييمات بعد — كن أول من يقيّم!</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="rounded-xl p-3.5" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: '#212529' }}>{r.customer_name}</span>
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</div>
                  </div>
                  {r.comment && <p className="text-sm" style={{ color: '#6c757d' }}>{r.comment}</p>}
                  <p className="text-xs mt-1" style={{ color: '#adb5bd' }}>{new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="bg-white mt-2 px-5 py-5">
            <h3 className="text-base font-bold mb-4" style={{ color: '#212529' }}>منتجات مشابهة</h3>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map(p => (
                <div key={p.id} className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow" style={{ border: '1.5px solid #e9ecef' }}
                  onClick={() => navigate(`/store/${slug}/product/${p.id}`)}>
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-36 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-36 flex items-center justify-center" style={{ backgroundColor: '#f1f3f5' }}><Package className="h-8 w-8" style={{ color: '#dee2e6' }} /></div>
                  )}
                  <div className="p-3">
                    <h4 className="text-sm font-semibold truncate" style={{ color: '#212529' }}>{p.name}</h4>
                    <span className="text-sm font-bold" style={{ color: pc }}>{p.discount_price || p.price} جنيه</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg z-50" style={{ borderColor: '#e9ecef' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          <button className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90" style={{ backgroundColor: pc, boxShadow: `0 4px 14px ${pc}40` }} onClick={addToCartAndGo}>
            <ShoppingCart className="h-4 w-4 inline ml-2" />
            أضف للسلة ({totalQuantity})
          </button>
          <button className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 transition-colors hover:bg-gray-50" style={{ borderColor: '#dee2e6', color: '#495057' }} onClick={() => setShowBuy(true)}>
            اشتري الآن
          </button>
        </div>
      </div>

      {/* Direct Buy Dialog */}
      <Dialog open={showBuy} onOpenChange={setShowBuy}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto sm:max-w-md p-0">
          <div className="p-5 border-b" style={{ borderColor: '#e9ecef' }}>
            <DialogTitle className="text-lg font-bold" style={{ color: '#212529' }}>شراء مباشر</DialogTitle>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-2xl p-4 space-y-1.5" style={{ backgroundColor: '#f1f3f5' }}>
              <p className="font-semibold text-sm" style={{ color: '#212529' }}>{product.name}</p>
              {selections.map((sel, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#6c757d' }}>
                  <span>• {sel.quantity} قطعة</span>
                  {sel.size && <span>— مقاس {sel.size}</span>}
                  {sel.color && <span>— {sel.color}</span>}
                </div>
              ))}
              <p className="font-bold text-sm mt-1" style={{ color: '#212529' }}>المنتج: {finalPrice * totalQuantity} جنيه</p>
              <p className="text-sm" style={{ color: '#6c757d' }}>التوصيل: {shippingCost} جنيه</p>
              <p className="text-base font-bold mt-1 border-t pt-2" style={{ borderColor: '#dee2e6', color: '#212529' }}>الإجمالي: {finalPrice * totalQuantity + shippingCost} جنيه</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>الاسم الكامل</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسمك" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>رقم الهاتف</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            {storeShipping.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold" style={{ color: '#343a40' }}>المحافظة</label>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger className="rounded-xl h-12 border-2" style={{ borderColor: '#e9ecef' }}><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                  <SelectContent>{storeShipping.map(s => <SelectItem key={s.id} value={s.governorate}>{s.governorate} — {s.shipping_cost} جنيه</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>العنوان بالتفصيل</label>
              <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="الشارع - المبنى - الشقة" rows={2} className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none resize-none" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>ملاحظات (اختياري)</label>
              <input value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="أي ملاحظات إضافية" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-lg" style={{ backgroundColor: pc, boxShadow: `0 4px 14px ${pc}40` }} onClick={directBuy} disabled={submitting}>
              {submitting ? "جاري التأكيد..." : "تأكيد الطلب"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold" style={{ color: '#212529' }}>أضف تقييمك</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>اسمك</label>
              <input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="أدخل اسمك" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>التقييم</label>
              <div className="flex gap-1.5">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewRating(s)}><Star className={`h-8 w-8 ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} /></button>)}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>تعليقك (اختياري)</label>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="اكتب رأيك..." rows={3} className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none resize-none" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-lg" style={{ backgroundColor: pc }} onClick={submitReview}>إرسال التقييم</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Menu Dialog */}
      <Dialog open={showShareMenu} onOpenChange={setShowShareMenu}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-lg font-bold" style={{ color: '#212529' }}>مشاركة المنتج</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => shareVia('whatsapp')} className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 hover:shadow-md transition-all" style={{ borderColor: '#e9ecef', color: '#212529' }}>
              <span className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#d4edda' }}><MessageCircle className="h-4 w-4" style={{ color: '#25D366' }} /></span>واتساب
            </button>
            <button onClick={() => shareVia('facebook')} className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 hover:shadow-md transition-all" style={{ borderColor: '#e9ecef', color: '#212529' }}>
              <span className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>f</span>فيسبوك
            </button>
            <button onClick={() => shareVia('twitter')} className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 hover:shadow-md transition-all" style={{ borderColor: '#e9ecef', color: '#212529' }}>
              <span className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f1f3f5' }}>𝕏</span>تويتر
            </button>
            <button onClick={() => shareVia('telegram')} className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 hover:shadow-md transition-all" style={{ borderColor: '#e9ecef', color: '#212529' }}>
              <span className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>✈</span>تليجرام
            </button>
          </div>
          <button onClick={() => shareVia('copy')} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 hover:bg-gray-50 mt-1" style={{ borderColor: '#e9ecef', color: '#495057' }}>
            <Copy className="h-4 w-4" /> نسخ الرابط
          </button>
        </DialogContent>
      </Dialog>

      <AlshbhWatermark />
    </div>
  );
}
