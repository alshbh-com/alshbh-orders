import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Store, ShoppingCart, Search, Star, Plus, Minus, Trash2, MessageCircle, Share2, X, AlertTriangle, Tag, MapPin, FileText, Truck, ChevronLeft, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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
  const [showSearch, setShowSearch] = useState(false);

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
    toast({ title: "تمت الإضافة للسلة", description: product.name });
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
      toast({ title: "تم تفعيل الكوبون بنجاح" });
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <p className="text-xs text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Store className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">المتجر غير موجود</h1>
        <p className="text-sm text-muted-foreground">تأكد من صحة الرابط</p>
      </div>
    );
  }

  if (store.points_balance <= 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center bg-background">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-foreground">{store.store_name}</h1>
          <p className="text-sm text-muted-foreground max-w-sm">المتجر متوقف مؤقتاً. يرجى المحاولة لاحقاً.</p>
        </div>
        <AlshbhWatermark />
      </div>
    );
  }

  const pc = store?.primary_color || "#e8c547";
  const sc = store?.secondary_color || "#d4a843";
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const onProductClick = (productId: string) => navigate(`/store/${slug}/product/${productId}`);

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-sm space-y-5">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">تم تأكيد طلبك</h1>
            <p className="text-sm text-muted-foreground">رقم الطلب</p>
            <p className="font-mono text-lg font-semibold text-foreground">{orderSuccess.slice(0, 8).toUpperCase()}</p>
          </div>
          <p className="text-sm text-muted-foreground">سيتم التواصل معك قريباً لتأكيد التفاصيل</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setOrderSuccess(null)} variant="outline" className="rounded-lg text-sm">العودة للمتجر</Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`مرحباً، طلبي رقم ${orderSuccess.slice(0, 8)}`)}`} target="_blank">
                <Button className="rounded-lg text-sm" style={{ backgroundColor: pc, color: '#1a1a1a' }}>تواصل واتساب</Button>
              </a>
            )}
          </div>
          <AlshbhWatermark />
        </div>
      </div>
    );
  }

  const pc = store.primary_color || "#e8c547";
  const sc = store.secondary_color || "#d4a843";
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const onProductClick = (productId: string) => navigate(`/store/${slug}/product/${productId}`);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fafaf8' }}>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#fafaf8', borderColor: '#e8e8e4' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: pc, color: '#1a1a1a' }}>
                {store.store_name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>{store.store_name}</h1>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSearch(!showSearch)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
                <Search className="h-4 w-4" style={{ color: '#555' }} />
              </button>
              <button onClick={shareStore} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
                <Share2 className="h-4 w-4" style={{ color: '#555' }} />
              </button>
              <button onClick={() => setShowCart(true)} className="h-8 w-8 rounded-full flex items-center justify-center relative hover:bg-black/5 transition-colors">
                <ShoppingCart className="h-4 w-4" style={{ color: '#1a1a1a' }} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: pc, color: '#1a1a1a' }}>{cartCount}</span>
                )}
              </button>
            </div>
          </div>
          {/* Search bar */}
          {showSearch && (
            <div className="mt-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#999' }} />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border outline-none focus:ring-1"
                  style={{ backgroundColor: '#f5f5f2', borderColor: '#e8e8e4', color: '#1a1a1a' }}
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ===== BANNER ===== */}
      {(store as any).banner_url && (
        <div className="max-w-lg mx-auto w-full">
          <div className="aspect-[2.5/1] overflow-hidden">
            <img src={(store as any).banner_url} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">

        {/* ===== CATEGORIES ===== */}
        {categories.length > 0 && (
          <div className="px-4 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
                style={!selectedCategory ? { backgroundColor: '#1a1a1a', color: '#fafaf8', borderColor: '#1a1a1a' } : { backgroundColor: 'transparent', color: '#666', borderColor: '#ddd' }}
              >
                الكل
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
                  style={selectedCategory === c.id ? { backgroundColor: '#1a1a1a', color: '#fafaf8', borderColor: '#1a1a1a' } : { backgroundColor: 'transparent', color: '#666', borderColor: '#ddd' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== FEATURED ===== */}
        {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
          <section className="px-4 pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#999' }}>مميز</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredProducts.map(p => (
                <div key={p.id} className="w-36 shrink-0 cursor-pointer group" onClick={() => onProductClick(p.id)}>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2" style={{ backgroundColor: '#f0efe9' }}>
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : <div className="w-full h-full" />}
                  </div>
                  <h3 className="text-xs font-medium truncate" style={{ color: '#1a1a1a' }}>{p.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#666' }}>{p.discount_price || p.price} جنيه</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== PRODUCTS GRID ===== */}
        <main className="flex-1 px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#999' }}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "المنتجات"}
            </h2>
            <span className="text-[11px]" style={{ color: '#bbb' }}>{filteredProducts.length}</span>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-8 w-8 mx-auto mb-2" style={{ color: '#ccc' }} />
              <p className="text-sm" style={{ color: '#999' }}>لا توجد منتجات</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(p => {
                const hasDiscount = p.discount_price && p.discount_price < p.price;
                const discountPercent = hasDiscount ? Math.round((1 - p.discount_price / p.price) * 100) : 0;
                const rating = getAvgRating(p.id);
                return (
                  <div key={p.id} className="cursor-pointer group" onClick={() => onProductClick(p.id)}>
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2" style={{ backgroundColor: '#f0efe9' }}>
                      {p.main_image_url ? (
                        <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : <div className="w-full h-full" />}
                      {hasDiscount && (
                        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: '#1a1a1a', color: '#fafaf8' }}>
                          -{discountPercent}%
                        </span>
                      )}
                      {p.stock !== null && p.stock <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(250,250,248,0.7)' }}>
                          <span className="text-xs font-medium" style={{ color: '#999' }}>نفذت الكمية</span>
                        </div>
                      )}
                      {/* Quick add button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="absolute bottom-2 left-2 h-7 w-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        style={{ backgroundColor: '#1a1a1a', color: '#fafaf8' }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <h3 className="text-xs font-medium line-clamp-1 leading-tight" style={{ color: '#1a1a1a' }}>{p.name}</h3>
                    {rating && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                        <span className="text-[10px]" style={{ color: '#999' }}>{rating}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>{p.discount_price || p.price} جنيه</span>
                      {hasDiscount && <span className="text-[10px] line-through" style={{ color: '#bbb' }}>{p.price}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Policies & Track */}
        <section className="px-4 pb-4 space-y-3">
          {storePolicies && (storePolicies.return_policy || storePolicies.shipping_policy || storePolicies.privacy_policy) && (
            <details className="rounded-lg p-3 border" style={{ borderColor: '#e8e8e4', backgroundColor: '#fafaf8' }}>
              <summary className="text-xs font-medium cursor-pointer flex items-center gap-1.5" style={{ color: '#666' }}>
                <FileText className="h-3 w-3" />
                سياسات المتجر
              </summary>
              <div className="mt-3 space-y-3 text-xs" style={{ color: '#666' }}>
                {storePolicies.return_policy && (
                  <div><h4 className="font-semibold mb-0.5" style={{ color: '#333' }}>سياسة الاسترجاع</h4><p className="whitespace-pre-line">{storePolicies.return_policy}</p></div>
                )}
                {storePolicies.shipping_policy && (
                  <div><h4 className="font-semibold mb-0.5" style={{ color: '#333' }}>سياسة الشحن</h4><p className="whitespace-pre-line">{storePolicies.shipping_policy}</p></div>
                )}
                {storePolicies.privacy_policy && (
                  <div><h4 className="font-semibold mb-0.5" style={{ color: '#333' }}>سياسة الخصوصية</h4><p className="whitespace-pre-line">{storePolicies.privacy_policy}</p></div>
                )}
              </div>
            </details>
          )}
          <div className="flex justify-center">
            <Link to="/track">
              <button className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-full border hover:bg-black/5 transition-colors" style={{ color: '#666', borderColor: '#ddd' }}>
                <Truck className="h-3 w-3" />تتبع طلبك
              </button>
            </Link>
          </div>
        </section>

        {/* Complaint */}
        <section className="px-4 pb-6">
          <details className="rounded-lg p-3 border" style={{ borderColor: '#e8e8e4' }}>
            <summary className="text-xs font-medium cursor-pointer flex items-center gap-1.5" style={{ color: '#666' }}>
              <MessageCircle className="h-3 w-3" />
              تواصل معنا
            </summary>
            <ComplaintForm storeId={store.id} storeName={store.store_name} whatsappNumber={store.whatsapp_number} pc={pc} />
          </details>
        </section>
      </div>

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0">
          <div className="p-4 border-b" style={{ borderColor: '#e8e8e4' }}>
            <SheetTitle className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>السلة ({cartCount})</SheetTitle>
          </div>
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2" style={{ color: '#ccc' }} />
                <p className="text-sm" style={{ color: '#999' }}>السلة فارغة</p>
              </div>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: '#f0f0ec' }}>
                    {item.product.main_image_url ? (
                      <img src={item.product.main_image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg" style={{ backgroundColor: '#f0efe9' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium truncate" style={{ color: '#1a1a1a' }}>{item.product.name}</h4>
                      {item.selectedSize && <p className="text-[11px]" style={{ color: '#999' }}>المقاس: {item.selectedSize}</p>}
                      {item.selectedColor && <p className="text-[11px]" style={{ color: '#999' }}>اللون: {item.selectedColor}</p>}
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#1a1a1a' }}>{item.product.discount_price || item.product.price} جنيه</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button className="h-6 w-6 rounded-full border flex items-center justify-center" style={{ borderColor: '#ddd' }} onClick={() => updateCartQuantity(idx, -1)}>
                          <Minus className="h-2.5 w-2.5" style={{ color: '#666' }} />
                        </button>
                        <span className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>{item.quantity}</span>
                        <button className="h-6 w-6 rounded-full border flex items-center justify-center" style={{ borderColor: '#ddd' }} onClick={() => updateCartQuantity(idx, 1)}>
                          <Plus className="h-2.5 w-2.5" style={{ color: '#666' }} />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(idx)} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                      <X className="h-3.5 w-3.5" style={{ color: '#999' }} />
                    </button>
                  </div>
                ))}
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#999' }}>المجموع</span>
                    <span style={{ color: '#1a1a1a' }}>{cartSubtotal} جنيه</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#999' }}>التوصيل</span>
                    <span style={{ color: '#1a1a1a' }}>{shippingCost} جنيه</span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm border-t pt-2" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }}>
                    <span>الإجمالي</span>
                    <span>{cartTotal} جنيه</span>
                  </div>
                  <button
                    className="w-full py-2.5 rounded-lg text-sm font-medium mt-2 transition-colors"
                    style={{ backgroundColor: '#1a1a1a', color: '#fafaf8' }}
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

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="rounded-xl max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>إتمام الطلب</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#666' }}>الاسم</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="الاسم الكامل" className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#666' }}>رقم الهاتف</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
            </div>

            {storeShipping.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#666' }}>المحافظة</label>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                  <SelectContent>
                    {storeShipping.map(s => (
                      <SelectItem key={s.id} value={s.governorate}>{s.governorate} — {s.shipping_cost} جنيه</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#666' }}>العنوان بالتفصيل</label>
              <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="الشارع - المبنى - الشقة" rows={2} className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 resize-none" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#666' }}>ملاحظات (اختياري)</label>
              <input value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="أي ملاحظات إضافية" className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
            </div>

            {/* Coupon */}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#666' }}>كوبون خصم</label>
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="أدخل الكود" dir="ltr" className="flex-1 px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
                <button onClick={applyCoupon} disabled={applyingCoupon} className="px-4 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-black/5" style={{ borderColor: '#ddd', color: '#1a1a1a' }}>
                  {applyingCoupon ? "..." : "تفعيل"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-[11px] px-2 py-1 rounded" style={{ color: '#2d7a3a', backgroundColor: '#f0faf2' }}>
                  ✓ كوبون {appliedCoupon.code} — خصم {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `${appliedCoupon.discount_value} جنيه`}
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: '#f5f5f2' }}>
              <div className="flex justify-between text-xs"><span style={{ color: '#999' }}>المنتجات</span><span style={{ color: '#1a1a1a' }}>{cartSubtotal} جنيه</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs" style={{ color: '#2d7a3a' }}><span>الخصم</span><span>-{discountAmount} جنيه</span></div>
              )}
              <div className="flex justify-between text-xs"><span style={{ color: '#999' }}>التوصيل {selectedGovernorate && `(${selectedGovernorate})`}</span><span style={{ color: '#1a1a1a' }}>{shippingCost} جنيه</span></div>
              <div className="flex justify-between font-semibold text-sm border-t pt-1.5" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }}>
                <span>الإجمالي</span><span>{cartTotal} جنيه</span>
              </div>
            </div>
            <button
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#1a1a1a', color: '#fafaf8' }}
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
    if (!name || !message) return;
    setSending(true);
    const { error } = await supabase.from("complaints").insert({
      name, phone: phone || null, message, store_id: storeId, store_name: storeName,
    });
    if (error) toast({ title: "حدث خطأ", variant: "destructive" });
    else { setSent(true); toast({ title: "تم إرسال رسالتك بنجاح" }); }
    setSending(false);
  };

  if (sent) return <p className="text-xs mt-3" style={{ color: '#2d7a3a' }}>تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.</p>;

  return (
    <div className="mt-3 space-y-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم" className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف (اختياري)" dir="ltr" className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
      <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="رسالتك..." rows={2} className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none" style={{ borderColor: '#e8e8e4', color: '#1a1a1a' }} />
      <div className="flex gap-2">
        <button onClick={submit} disabled={sending} className="px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50" style={{ backgroundColor: '#1a1a1a', color: '#fafaf8' }}>
          {sending ? "جاري الإرسال..." : "إرسال"}
        </button>
        {whatsappNumber && (
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank">
            <button className="px-4 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: '#ddd', color: '#666' }}>واتساب</button>
          </a>
        )}
      </div>
    </div>
  );
}
