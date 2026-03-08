import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Store, ShoppingCart, Search, Star, Plus, Minus, Trash2, MessageCircle, Share2, X, AlertTriangle, Tag, MapPin, FileText, Truck, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CartItem {
  product: any;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export default function StoreFront() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [storeShipping, setStoreShipping] = useState<any[]>([]);
  const [storePolicies, setStorePolicies] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores").select("*").eq("store_slug", slug).eq("is_active", true).maybeSingle();

      if (storeData) {
        setStore(storeData);
        const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
        localStorage.setItem('visitor_id', visitorId);
        (supabase as any).from("page_views").insert({
          store_id: storeData.id, page_path: `/store/${slug}`, visitor_id: visitorId,
        }).then(() => {});

        const savedCart = localStorage.getItem(`cart_${storeData.id}`);
        if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch {} }

        const [productsRes, categoriesRes, reviewsRes, shippingRes, policiesRes] = await Promise.all([
          supabase.from("products").select("*").eq("store_id", storeData.id).eq("is_active", true),
          supabase.from("categories").select("*").eq("store_id", storeData.id).order("sort_order"),
          supabase.from("reviews").select("*").in("product_id",
            (await supabase.from("products").select("id").eq("store_id", storeData.id)).data?.map(p => p.id) || []
          ),
          supabase.from("store_shipping").select("*").eq("store_id", storeData.id).eq("is_active", true),
          (supabase as any).from("store_policies").select("*").eq("store_id", storeData.id).maybeSingle(),
        ]);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
        setReviews(reviewsRes.data || []);
        setStoreShipping(shippingRes.data || []);
        setStorePolicies(policiesRes.data || null);
      }
      setLoading(false);
    };
    fetchStore();
  }, [slug]);

  useEffect(() => {
    if (store) localStorage.setItem(`cart_${store.id}`, JSON.stringify(cart));
  }, [cart, store]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery) result = result.filter(p => p.name.includes(searchQuery) || p.description?.includes(searchQuery));
    if (selectedCategory) result = result.filter(p => p.category_id === selectedCategory);
    return result;
  }, [products, searchQuery, selectedCategory]);

  const featuredProducts = useMemo(() => products.filter(p => p.is_featured), [products]);

  const addToCart = (product: any, size?: string, color?: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.selectedSize === size && i.selectedColor === color);
      if (existing) return prev.map(i => i.product.id === product.id && i.selectedSize === size && i.selectedColor === color ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    toast({ title: "تمت الإضافة للسلة ✓", description: product.name });
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((i, idx) => idx === index ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const getShippingCost = () => {
    if (selectedGovernorate && storeShipping.length > 0) {
      const found = storeShipping.find(s => s.governorate === selectedGovernorate);
      return found ? Number(found.shipping_cost) : (store?.shipping_cost || 70);
    }
    return store?.shipping_cost || 70;
  };

  const shippingCost = getShippingCost();
  const cartSubtotal = cart.reduce((sum, i) => sum + (i.product.discount_price || i.product.price) * i.quantity, 0);
  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? Math.round(cartSubtotal * appliedCoupon.discount_value / 100)
      : Math.min(appliedCoupon.discount_value, cartSubtotal)
    : 0;
  const cartTotal = cartSubtotal - discountAmount + shippingCost;

  const applyCoupon = async () => {
    if (!couponCode.trim() || !store) return;
    setApplyingCoupon(true);
    const { data } = await supabase.from("coupons").select("*")
      .eq("store_id", store.id).eq("code", couponCode.trim().toUpperCase()).eq("is_active", true).maybeSingle();
    if (!data) {
      toast({ title: "كوبون غير صالح", variant: "destructive" });
      setAppliedCoupon(null);
    } else if (data.max_uses && data.used_count >= data.max_uses) {
      toast({ title: "الكوبون انتهى", variant: "destructive" });
      setAppliedCoupon(null);
    } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({ title: "الكوبون منتهي الصلاحية", variant: "destructive" });
      setAppliedCoupon(null);
    } else if (data.min_order_amount && cartSubtotal < data.min_order_amount) {
      toast({ title: `الحد الأدنى للطلب ${data.min_order_amount} جنيه`, variant: "destructive" });
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(data);
      toast({ title: "تم تفعيل الكوبون بنجاح ✓" });
    }
    setApplyingCoupon(false);
  };

  const submitOrder = async () => {
    if (!customerName || !customerPhone || !customerAddress || cart.length === 0) {
      toast({ title: "يرجى إكمال جميع البيانات", variant: "destructive" });
      return;
    }
    if (storeShipping.length > 0 && !selectedGovernorate) {
      toast({ title: "يرجى اختيار المحافظة", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data: order, error } = await supabase.from("orders").insert({
      store_id: store.id, customer_name: customerName,
      customer_phone: customerPhone, customer_address: customerAddress,
      customer_notes: customerNotes || null, total_price: cartTotal,
      shipping_cost: shippingCost,
      coupon_code: appliedCoupon?.code || null,
      discount_amount: discountAmount || 0,
    }).select().single();
    if (error || !order) {
      toast({ title: "حدث خطأ", description: error?.message, variant: "destructive" });
      setSubmitting(false); return;
    }
    await supabase.from("order_items").insert(
      cart.map(i => ({
        order_id: order.id, product_id: i.product.id,
        quantity: i.quantity, price: i.product.discount_price || i.product.price,
        selected_size: i.selectedSize || null, selected_color: i.selectedColor || null,
      }))
    );
    if (appliedCoupon) {
      await supabase.from("coupons").update({ used_count: appliedCoupon.used_count + 1 }).eq("id", appliedCoupon.id);
    }
    for (const item of cart) {
      await supabase.from("products").update({ sales_count: (item.product.sales_count || 0) + item.quantity } as any).eq("id", item.product.id);
    }
    setCart([]); setShowCheckout(false); setOrderSuccess(order.id);
    setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); setCustomerNotes("");
    setCouponCode(""); setAppliedCoupon(null); setSelectedGovernorate("");
    setSubmitting(false);
  };

  const getAvgRating = (productId: string) => {
    const productReviews = reviews.filter(r => r.product_id === productId);
    if (productReviews.length === 0) return null;
    return (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1);
  };

  const shareStore = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: store?.store_name, url });
    else { navigator.clipboard.writeText(url); toast({ title: "تم نسخ الرابط" }); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3" style={{ borderColor: '#e9ecef', borderTopColor: '#6c757d' }} />
          <p className="text-sm" style={{ color: '#6c757d' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ backgroundColor: '#f8f9fa' }}>
        <Store className="h-14 w-14" style={{ color: '#adb5bd' }} />
        <h1 className="text-xl font-bold" style={{ color: '#343a40' }}>المتجر غير موجود</h1>
        <p className="text-sm" style={{ color: '#6c757d' }}>تأكد من صحة الرابط</p>
      </div>
    );
  }

  if (store.points_balance <= 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center" style={{ backgroundColor: '#f8f9fa' }}>
        <AlertTriangle className="h-14 w-14" style={{ color: '#adb5bd' }} />
        <div className="space-y-2">
          <h1 className="text-xl font-bold" style={{ color: '#343a40' }}>{store.store_name}</h1>
          <p className="text-sm max-w-sm" style={{ color: '#6c757d' }}>المتجر متوقف مؤقتاً. يرجى المحاولة لاحقاً.</p>
        </div>
        <AlshbhWatermark />
      </div>
    );
  }

  const pc = store?.primary_color || "#4f46e5";
  const sc = store?.secondary_color || "#7c3aed";
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const onProductClick = (productId: string) => navigate(`/store/${slug}/product/${productId}`);

  // Lighter version of primary for backgrounds
  const pcLight = pc + "18";

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center max-w-sm space-y-6 bg-white rounded-2xl p-8 shadow-sm">
          <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#d4edda' }}>
            <svg className="h-10 w-10" style={{ color: '#28a745' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold" style={{ color: '#212529' }}>تم تأكيد طلبك بنجاح!</h1>
            <p className="text-sm" style={{ color: '#6c757d' }}>رقم الطلب</p>
            <p className="font-mono text-xl font-bold" style={{ color: '#212529' }}>{orderSuccess.slice(0, 8).toUpperCase()}</p>
          </div>
          <p className="text-sm" style={{ color: '#6c757d' }}>سيتم التواصل معك قريباً لتأكيد التفاصيل</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setOrderSuccess(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50" style={{ borderColor: '#dee2e6', color: '#495057' }}>
              العودة للمتجر
            </button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`مرحباً، طلبي رقم ${orderSuccess.slice(0, 8)}`)}`} target="_blank">
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#25D366' }}>
                  تواصل واتساب
                </button>
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
      
      {/* ===== HERO HEADER ===== */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="relative max-w-lg mx-auto px-5 pt-5 pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="h-11 w-11 rounded-xl object-cover border-2 border-white/30 shadow-lg" />
              ) : (
                <div className="h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold bg-white/20 text-white border-2 border-white/30">
                  {store.store_name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg text-white leading-tight">{store.store_name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={shareStore} className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors text-white">
                <Share2 className="h-4.5 w-4.5" />
              </button>
              <button onClick={() => setShowCart(true)} className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors text-white relative">
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-[10px] flex items-center justify-center font-bold" style={{ color: pc }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-5">
            <p className="text-white/80 text-sm">مرحباً بك في</p>
            <h2 className="text-2xl font-bold text-white mt-1">{store.store_name}</h2>
            <p className="text-white/70 text-sm mt-1">اختر من منتجاتنا المميزة</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3.5 text-sm rounded-2xl border-0 outline-none shadow-lg placeholder:text-gray-400"
              style={{ backgroundColor: 'white', color: '#212529' }}
            />
          </div>
        </div>
      </header>

      {/* ===== BANNER ===== */}
      {(store as any).banner_url && (
        <div className="max-w-lg mx-auto w-full px-4 -mt-2 relative z-10">
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img src={(store as any).banner_url} alt="" className="w-full h-40 object-cover" />
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">

        {/* ===== CATEGORIES ===== */}
        {categories.length > 0 && (
          <div className="px-4 pt-5">
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                style={!selectedCategory
                  ? { backgroundColor: pc, color: 'white', boxShadow: `0 4px 14px ${pc}40` }
                  : { backgroundColor: 'white', color: '#495057', border: '1.5px solid #e9ecef' }
                }
              >
                الكل
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                  style={selectedCategory === c.id
                    ? { backgroundColor: pc, color: 'white', boxShadow: `0 4px 14px ${pc}40` }
                    : { backgroundColor: 'white', color: '#495057', border: '1.5px solid #e9ecef' }
                  }
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== FEATURED PRODUCTS (Horizontal scroll) ===== */}
        {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
          <section className="px-4 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#212529' }}>منتجات مميزة ⭐</h2>
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-hide">
              {featuredProducts.map(p => {
                const hasDiscount = p.discount_price && p.discount_price < p.price;
                return (
                  <div key={p.id} className="w-44 shrink-0 cursor-pointer group" onClick={() => onProductClick(p.id)}>
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-2.5 bg-white shadow-sm">
                      {p.main_image_url ? (
                        <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f1f3f5' }}>
                          <Package className="h-8 w-8" style={{ color: '#ced4da' }} />
                        </div>
                      )}
                      {hasDiscount && (
                        <span className="absolute top-2.5 right-2.5 text-[11px] font-bold px-2 py-1 rounded-lg text-white" style={{ backgroundColor: '#dc3545' }}>
                          -{Math.round((1 - p.discount_price / p.price) * 100)}%
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold truncate" style={{ color: '#212529' }}>{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold" style={{ color: pc }}>{p.discount_price || p.price} جنيه</span>
                      {hasDiscount && <span className="text-xs line-through" style={{ color: '#adb5bd' }}>{p.price}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== ALL PRODUCTS GRID ===== */}
        <main className="flex-1 px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#212529' }}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "جميع المنتجات"}
            </h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>
              {filteredProducts.length} منتج
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 mx-auto mb-3" style={{ color: '#dee2e6' }} />
              <p className="text-sm font-medium" style={{ color: '#6c757d' }}>لا توجد منتجات</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProducts.map(p => {
                const hasDiscount = p.discount_price && p.discount_price < p.price;
                const discountPercent = hasDiscount ? Math.round((1 - p.discount_price / p.price) * 100) : 0;
                const rating = getAvgRating(p.id);
                return (
                  <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onProductClick(p.id)}>
                    <div className="relative aspect-square overflow-hidden">
                      {p.main_image_url ? (
                        <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f1f3f5' }}>
                          <Package className="h-10 w-10" style={{ color: '#dee2e6' }} />
                        </div>
                      )}
                      {hasDiscount && (
                        <span className="absolute top-2.5 right-2.5 text-[11px] font-bold px-2 py-1 rounded-lg text-white" style={{ backgroundColor: '#dc3545' }}>
                          -{discountPercent}%
                        </span>
                      )}
                      {p.stock !== null && p.stock <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <span className="text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#f8d7da', color: '#842029' }}>نفذت الكمية</span>
                        </div>
                      )}
                      {/* Quick add */}
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="absolute bottom-2.5 left-2.5 h-9 w-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg text-white"
                        style={{ backgroundColor: pc }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-1.5" style={{ color: '#212529' }}>{p.name}</h3>
                      {rating && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium" style={{ color: '#495057' }}>{rating}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: pc }}>{p.discount_price || p.price} جنيه</span>
                        {hasDiscount && <span className="text-xs line-through" style={{ color: '#adb5bd' }}>{p.price}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ===== FOOTER SECTION ===== */}
        <section className="px-4 pb-4 space-y-3">
          {/* Policies */}
          {storePolicies && (storePolicies.return_policy || storePolicies.shipping_policy || storePolicies.privacy_policy) && (
            <details className="bg-white rounded-2xl p-4 shadow-sm">
              <summary className="text-sm font-semibold cursor-pointer flex items-center gap-2" style={{ color: '#495057' }}>
                <FileText className="h-4 w-4" style={{ color: pc }} />
                سياسات المتجر
              </summary>
              <div className="mt-3 space-y-3 text-sm" style={{ color: '#6c757d' }}>
                {storePolicies.return_policy && (
                  <div><h4 className="font-semibold mb-1" style={{ color: '#343a40' }}>سياسة الاسترجاع</h4><p className="whitespace-pre-line leading-relaxed">{storePolicies.return_policy}</p></div>
                )}
                {storePolicies.shipping_policy && (
                  <div><h4 className="font-semibold mb-1" style={{ color: '#343a40' }}>سياسة الشحن</h4><p className="whitespace-pre-line leading-relaxed">{storePolicies.shipping_policy}</p></div>
                )}
                {storePolicies.privacy_policy && (
                  <div><h4 className="font-semibold mb-1" style={{ color: '#343a40' }}>سياسة الخصوصية</h4><p className="whitespace-pre-line leading-relaxed">{storePolicies.privacy_policy}</p></div>
                )}
              </div>
            </details>
          )}

          {/* Track order + Contact */}
          <div className="flex gap-3">
            <Link to="/track" className="flex-1">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: pcLight }}>
                  <Truck className="h-5 w-5" style={{ color: pc }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#212529' }}>تتبع طلبك</p>
                  <p className="text-xs" style={{ color: '#6c757d' }}>تابع حالة طلبك</p>
                </div>
              </div>
            </Link>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank" className="flex-1">
                <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#d4edda' }}>
                    <MessageCircle className="h-5 w-5" style={{ color: '#28a745' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#212529' }}>تواصل معنا</p>
                    <p className="text-xs" style={{ color: '#6c757d' }}>واتساب</p>
                  </div>
                </div>
              </a>
            )}
          </div>
        </section>

        {/* Complaint */}
        <section className="px-4 pb-6">
          <details className="bg-white rounded-2xl p-4 shadow-sm">
            <summary className="text-sm font-semibold cursor-pointer flex items-center gap-2" style={{ color: '#495057' }}>
              <MessageCircle className="h-4 w-4" style={{ color: pc }} />
              شكوى أو استفسار
            </summary>
            <ComplaintForm storeId={store.id} storeName={store.store_name} whatsappNumber={store.whatsapp_number} pc={pc} />
          </details>
        </section>
      </div>

      {/* ===== CART SHEET ===== */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="bg-white p-5 border-b" style={{ borderColor: '#e9ecef' }}>
            <SheetTitle className="text-lg font-bold" style={{ color: '#212529' }}>سلة المشتريات ({cartCount})</SheetTitle>
          </div>
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#e9ecef' }}>
                  <ShoppingCart className="h-7 w-7" style={{ color: '#adb5bd' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#6c757d' }}>السلة فارغة</p>
                <p className="text-xs mt-1" style={{ color: '#adb5bd' }}>أضف منتجات للبدء</p>
              </div>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                    {item.product.main_image_url ? (
                      <img src={item.product.main_image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f1f3f5' }}>
                        <Package className="h-6 w-6" style={{ color: '#ced4da' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate" style={{ color: '#212529' }}>{item.product.name}</h4>
                      {item.selectedSize && <p className="text-xs mt-0.5" style={{ color: '#6c757d' }}>المقاس: {item.selectedSize}</p>}
                      {item.selectedColor && <p className="text-xs" style={{ color: '#6c757d' }}>اللون: {item.selectedColor}</p>}
                      <p className="text-sm font-bold mt-1" style={{ color: pc }}>{item.product.discount_price || item.product.price} جنيه</p>
                      <div className="flex items-center gap-2.5 mt-2">
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center border" style={{ borderColor: '#dee2e6' }} onClick={() => updateCartQuantity(idx, -1)}>
                          <Minus className="h-3 w-3" style={{ color: '#495057' }} />
                        </button>
                        <span className="text-sm font-bold" style={{ color: '#212529' }}>{item.quantity}</span>
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: pc }} onClick={() => updateCartQuantity(idx, 1)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(idx)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" style={{ color: '#dc3545' }} />
                    </button>
                  </div>
                ))}
                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2.5 mt-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6c757d' }}>المجموع</span>
                    <span className="font-semibold" style={{ color: '#212529' }}>{cartSubtotal} جنيه</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6c757d' }}>التوصيل</span>
                    <span className="font-semibold" style={{ color: '#212529' }}>{shippingCost} جنيه</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2.5" style={{ borderColor: '#e9ecef', color: '#212529' }}>
                    <span>الإجمالي</span>
                    <span>{cartTotal} جنيه</span>
                  </div>
                  <button
                    className="w-full py-3.5 rounded-xl text-sm font-bold mt-3 transition-opacity hover:opacity-90 text-white shadow-lg"
                    style={{ backgroundColor: pc, boxShadow: `0 4px 14px ${pc}40` }}
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  >
                    إتمام الطلب
                  </button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== CHECKOUT DIALOG ===== */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto sm:max-w-md p-0">
          <div className="p-5 border-b" style={{ borderColor: '#e9ecef' }}>
            <DialogTitle className="text-lg font-bold" style={{ color: '#212529' }}>إتمام الطلب</DialogTitle>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>الاسم الكامل</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسمك" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none focus:border-current transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>رقم الهاتف</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none focus:border-current transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>

            {storeShipping.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold" style={{ color: '#343a40' }}>المحافظة</label>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger className="rounded-xl h-12 border-2" style={{ borderColor: '#e9ecef' }}><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                  <SelectContent>
                    {storeShipping.map(s => (
                      <SelectItem key={s.id} value={s.governorate}>{s.governorate} — {s.shipping_cost} جنيه</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>العنوان بالتفصيل</label>
              <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="الشارع - المبنى - الشقة" rows={2} className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none focus:border-current resize-none transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>ملاحظات (اختياري)</label>
              <input value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="أي ملاحظات إضافية" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none focus:border-current transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
            </div>

            {/* Coupon */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: '#343a40' }}>كوبون خصم</label>
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="أدخل الكود" dir="ltr" className="flex-1 px-4 py-3 text-sm rounded-xl border-2 outline-none focus:border-current transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
                <button onClick={applyCoupon} disabled={applyingCoupon} className="px-5 py-3 rounded-xl text-sm font-bold border-2 transition-colors hover:bg-gray-50" style={{ borderColor: '#dee2e6', color: '#495057' }}>
                  {applyingCoupon ? "..." : "تفعيل"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs px-3 py-2 rounded-xl font-medium" style={{ color: '#0f5132', backgroundColor: '#d1e7dd' }}>
                  ✓ كوبون {appliedCoupon.code} — خصم {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `${appliedCoupon.discount_value} جنيه`}
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#f1f3f5' }}>
              <div className="flex justify-between text-sm"><span style={{ color: '#6c757d' }}>المنتجات</span><span className="font-semibold" style={{ color: '#212529' }}>{cartSubtotal} جنيه</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#198754' }}><span>الخصم</span><span className="font-semibold">-{discountAmount} جنيه</span></div>
              )}
              <div className="flex justify-between text-sm"><span style={{ color: '#6c757d' }}>التوصيل {selectedGovernorate && `(${selectedGovernorate})`}</span><span className="font-semibold" style={{ color: '#212529' }}>{shippingCost} جنيه</span></div>
              <div className="flex justify-between text-base font-bold border-t pt-2" style={{ borderColor: '#dee2e6', color: '#212529' }}>
                <span>الإجمالي</span><span>{cartTotal} جنيه</span>
              </div>
            </div>
            <button
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-90 text-white shadow-lg"
              style={{ backgroundColor: pc, boxShadow: `0 4px 14px ${pc}40` }}
              onClick={submitOrder} disabled={submitting}
            >
              {submitting ? "جاري التأكيد..." : "تأكيد الطلب"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {store.facebook_pixel && (
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${store.facebook_pixel}');fbq('track','PageView');` }} />
      )}

      <WhatsAppFloat phone={store.whatsapp_number} />
      <AlshbhWatermark />
    </div>
  );
}

function ComplaintForm({ storeId, storeName, whatsappNumber, pc }: { storeId: string; storeName: string; whatsappNumber?: string; pc: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!name || !message) { toast({ title: "اكتب اسمك ورسالتك", variant: "destructive" }); return; }
    setSending(true);
    await supabase.from("complaints").insert({ store_id: storeId, store_name: storeName, name, phone: phone || null, message });
    setSent(true); setSending(false);
    toast({ title: "تم إرسال رسالتك بنجاح" });
  };

  if (sent) return <p className="text-sm py-3" style={{ color: '#198754' }}>✓ تم إرسال رسالتك — سنتواصل معك قريباً</p>;

  return (
    <div className="mt-3 space-y-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف (اختياري)" dir="ltr" className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
      <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب رسالتك..." rows={3} className="w-full px-4 py-3 text-sm rounded-xl border-2 outline-none resize-none transition-colors" style={{ borderColor: '#e9ecef', color: '#212529' }} />
      <button onClick={submit} disabled={sending} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: pc }}>
        {sending ? "جاري الإرسال..." : "إرسال"}
      </button>
    </div>
  );
}
