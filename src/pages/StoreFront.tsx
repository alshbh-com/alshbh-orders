import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Store, ShoppingCart, Search, Star, Plus, Minus, Trash2, MessageCircle, Share2, X, AlertTriangle, Tag, Sparkles, TrendingUp, MapPin, FileText, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores").select("*").eq("store_slug", slug).eq("is_active", true).maybeSingle();

      if (storeData) {
        setStore(storeData);
        // Track page view
        const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
        localStorage.setItem('visitor_id', visitorId);
        (supabase as any).from("page_views").insert({
          store_id: storeData.id,
          page_path: `/store/${slug}`,
          visitor_id: visitorId,
        }).then(() => {});

        const savedCart = localStorage.getItem(`cart_${storeData.id}`);
        if (savedCart) {
          try { setCart(JSON.parse(savedCart)); } catch {}
        }

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
    if (searchQuery) {
      result = result.filter(p => p.name.includes(searchQuery) || p.description?.includes(searchQuery));
    }
    if (selectedCategory) {
      result = result.filter(p => p.category_id === selectedCategory);
    }
    return result;
  }, [products, searchQuery, selectedCategory]);

  const featuredProducts = useMemo(() => products.filter(p => p.is_featured), [products]);
  const bestSellers = useMemo(() => [...products].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 4), [products]);

  const addToCart = (product: any, size?: string, color?: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.selectedSize === size && i.selectedColor === color);
      if (existing) return prev.map(i => i.product.id === product.id && i.selectedSize === size && i.selectedColor === color ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    toast({ title: "حلو اوي! اتضاف في السلة 🛒", description: product.name });
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
      toast({ title: "الكوبون ده مش صح يسطا 😕", variant: "destructive" });
      setAppliedCoupon(null);
    } else if (data.max_uses && data.used_count >= data.max_uses) {
      toast({ title: "الكوبون ده خلص للأسف 😅", variant: "destructive" });
      setAppliedCoupon(null);
    } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({ title: "الكوبون ده انتهت صلاحيته يا اخويا", variant: "destructive" });
      setAppliedCoupon(null);
    } else if (data.min_order_amount && cartSubtotal < data.min_order_amount) {
      toast({ title: `لازم الطلب يكون ${data.min_order_amount} جنيه على الأقل عشان الكوبون يشتغل`, variant: "destructive" });
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(data);
      toast({ title: "تمام! الكوبون اتفعّل 🎉" });
    }
    setApplyingCoupon(false);
  };

  const submitOrder = async () => {
    if (!customerName || !customerPhone || !customerAddress || cart.length === 0) {
      toast({ title: "يسطا اكتب كل البيانات الأول! 📝", variant: "destructive" });
      return;
    }
    if (storeShipping.length > 0 && !selectedGovernorate) {
      toast({ title: "اختار المحافظة بتاعتك يا اخويا! 📍", variant: "destructive" });
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
      toast({ title: "حصلت مشكلة يسطا 😕", description: error?.message, variant: "destructive" });
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
    // Update sales count
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
    const avg = productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length;
    return avg.toFixed(1);
  };

  const shareStore = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: store?.store_name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "تم نسخ الرابط يسطا! 📋" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">ثانية واحدة يسطا... ⏳</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-background to-muted">
        <div className="rounded-3xl bg-muted p-6">
          <Store className="h-16 w-16 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">المتجر ده مش موجود يسطا 😕</h1>
        <p className="text-muted-foreground">يمكن الرابط غلط أو المتجر اتوقف</p>
      </div>
    );
  }

  if (store.points_balance <= 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center bg-gradient-to-br from-background to-muted">
        <div className="rounded-3xl bg-destructive/10 p-6">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{store.store_name}</h1>
          <p className="text-muted-foreground max-w-md">
            المتجر ده واقف شوية يا اخويا 😕 صاحب المتجر محتاج يشحن نقاط عشان يرجع يستقبل طلبات تاني.
          </p>
        </div>
        <div className="bg-muted rounded-xl p-4 max-w-sm text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">❓ إيه الحكاية؟</p>
          <p>كل طلب بياخد نقطة واحدة من صاحب المتجر. لما النقاط تخلص، المتجر بيوقف لحد ما يشحن تاني. الموضوع بسيط!</p>
        </div>
        <AlshbhWatermark />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="text-center max-w-md space-y-6 bg-card rounded-3xl p-8 shadow-xl border border-border">
          <div className="text-7xl">🎉</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">تمام يسطا! طلبك اتسجل 🔥</h1>
            <div className="bg-muted rounded-xl p-3">
              <p className="text-sm text-muted-foreground">رقم الطلب بتاعك</p>
              <p className="font-mono font-bold text-xl text-primary">{orderSuccess.slice(0, 8)}</p>
            </div>
          </div>
          <p className="text-muted-foreground">استنى شوية وهنكلمك على الواتساب أو التليفون عشان نأكد الطلب 📞</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setOrderSuccess(null)} className="rounded-xl">يلا ارجع للمتجر 🛍️</Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`ازيك يسطا! أنا عملت طلب رقم ${orderSuccess.slice(0, 8)} 🎉`)}`} target="_blank">
                <Button variant="outline" className="rounded-xl"><MessageCircle className="h-4 w-4 ml-1" />كلمنا واتساب</Button>
              </a>
            )}
          </div>
          <AlshbhWatermark />
        </div>
      </div>
    );
  }

  const pc = store.primary_color || "#D97706";
  const sc = store.secondary_color || "#F59E0B";
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const onProductClick = (productId: string) => navigate(`/store/${slug}/product/${productId}`);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ backgroundColor: pc }}>
                {store.store_name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base truncate">{store.store_name}</h1>
              <p className="text-[11px] text-muted-foreground">{products.length} منتج</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={shareStore}><Share2 className="h-4 w-4" /></Button>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MessageCircle className="h-4 w-4" /></Button>
                </a>
              )}
              <Button size="icon" className="h-9 w-9 rounded-full relative text-white shadow-sm" style={{ backgroundColor: pc }} onClick={() => setShowCart(true)}>
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold animate-in zoom-in">{cartCount}</span>}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== BANNER ===== */}
      {(store as any).banner_url ? (
        <div className="h-40 sm:h-48 overflow-hidden">
          <img src={(store as any).banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-28 sm:h-36 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}>
          <div className="text-center text-white">
            <h2 className="text-xl font-bold drop-shadow">{store.store_name}</h2>
            <p className="text-white/70 text-sm mt-1">أهلاً بيك! نورتنا 😍</p>
          </div>
        </div>
      )}

      {/* ===== SEARCH ===== */}
      <div className="container mt-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-xl h-10 bg-muted/50 border-0" />
        </div>
      </div>

      {/* ===== CATEGORIES ===== */}
      {categories.length > 0 && (
        <div className="container mt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory ? 'text-white shadow-md' : 'bg-muted text-foreground'}`} style={!selectedCategory ? { backgroundColor: pc } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === c.id ? 'text-white shadow-md' : 'bg-muted text-foreground'}`} style={selectedCategory === c.id ? { backgroundColor: pc } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== FEATURED ===== */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: pc }}>
            <Sparkles className="h-4 w-4" />مميز
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-44 shrink-0 cursor-pointer group" onClick={() => onProductClick(p.id)}>
                <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-muted">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : <div className="w-full h-full" />}
                </div>
                <h3 className="text-xs font-semibold truncate">{p.name}</h3>
                <p className="text-xs font-bold mt-0.5" style={{ color: pc }}>{p.discount_price || p.price} جنيه</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== PRODUCTS GRID ===== */}
      <main className="flex-1 container py-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "كل المنتجات"}</h2>
          <span className="text-xs text-muted-foreground">{filteredProducts.length} منتج</span>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">مفيش منتجات</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              const discountPercent = hasDiscount ? Math.round((1 - p.discount_price / p.price) * 100) : 0;
              return (
                <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : <div className="w-full h-full" />}
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: pc }}>
                        -{discountPercent}%
                      </span>
                    )}
                    {p.stock !== null && p.stock <= 0 && (
                      <span className="absolute bottom-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">نفذ</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[13px] font-semibold line-clamp-2 leading-tight mb-1">{p.name}</h3>
                    {getAvgRating(p.id) && (
                      <div className="flex items-center gap-0.5 mb-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-[11px] text-muted-foreground">{getAvgRating(p.id)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{ color: pc }}>{p.discount_price || p.price} جنيه</span>
                      {hasDiscount && <span className="text-[11px] text-muted-foreground line-through">{p.price}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>


      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>السلة بتاعتك 🛒 ({cartCount})</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-semibold">السلة فاضية يسطا 😅</p>
                <p className="text-sm text-muted-foreground mt-1">يلا اختار حاجة حلوة من المتجر!</p>
              </div>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                    {item.product.main_image_url ? (
                      <img src={item.product.main_image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                      {item.selectedSize && <p className="text-xs text-muted-foreground">المقاس: {item.selectedSize}</p>}
                      {item.selectedColor && <p className="text-xs text-muted-foreground">اللون: {item.selectedColor}</p>}
                      <p className="text-sm font-bold mt-0.5" style={{ color: store.primary_color }}>{item.product.discount_price || item.product.price} جنيه</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => updateCartQuantity(idx, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => updateCartQuantity(idx, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="shrink-0" onClick={() => removeFromCart(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المنتجات</span>
                    <span>{cartSubtotal} جنيه</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">التوصيل {selectedGovernorate && `(${selectedGovernorate})`}</span>
                    <span>{shippingCost} جنيه</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                    <span>الإجمالي</span>
                    <span style={{ color: store.primary_color }}>{cartTotal} جنيه</span>
                  </div>
                  <Button className="w-full mt-2 rounded-xl h-11" onClick={() => { setShowCart(false); setShowCheckout(true); }}>
                    يلا نكمل الطلب! 🚀
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>يلا نكمل الطلب! 📦</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسمك إيه يا اخويا؟ 😊</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="محمد أحمد" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>رقم موبايلك 📱</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" className="rounded-xl" />
            </div>

            {/* Governorate Selection */}
            {storeShipping.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" />المحافظة بتاعتك 📍</Label>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="اختار محافظتك يسطا..." />
                  </SelectTrigger>
                  <SelectContent>
                    {storeShipping.map(s => (
                      <SelectItem key={s.id} value={s.governorate}>
                        {s.governorate} — {s.shipping_cost} جنيه توصيل
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>العنوان بالتفصيل 🏠</Label>
              <Textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="الشارع والعمارة والشقة..." className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>عايز تقولنا حاجة؟ (اختياري)</Label>
              <Input value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="مثلاً: عايزه يتلف كويس 🎁" className="rounded-xl" />
            </div>
            {/* Coupon */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Tag className="h-3 w-3" />عندك كوبون خصم؟ 🎫</Label>
              <div className="flex gap-2">
                <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="اكتب الكود هنا" dir="ltr" className="flex-1 rounded-xl" />
                <Button variant="outline" onClick={applyCoupon} disabled={applyingCoupon} className="rounded-xl">
                  {applyingCoupon ? "..." : "فعّل! ✨"}
                </Button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-green-600 bg-green-50 rounded-lg px-2 py-1">✅ تمام! كوبون {appliedCoupon.code} — خصم {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `${appliedCoupon.discount_value} جنيه`}</p>
              )}
            </div>
            <div className="bg-muted/50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">المنتجات</span><span>{cartSubtotal} جنيه</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600"><span>الخصم 🎉</span><span>-{discountAmount} جنيه</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">التوصيل {selectedGovernorate && `(${selectedGovernorate})`}</span><span>{shippingCost} جنيه</span></div>
              <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                <span>الإجمالي</span>
                <span style={{ color: store.primary_color }}>{cartTotal} جنيه</span>
              </div>
            </div>
            <Button className="w-full rounded-xl h-11" onClick={submitOrder} disabled={submitting}>
              {submitting ? "ثانية يسطا... ⏳" : "أكد الطلب 🎉"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policies & Track Order */}
      <section className="container pb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {storePolicies && (storePolicies.return_policy || storePolicies.shipping_policy || storePolicies.privacy_policy) && (
            <details className="w-full bg-card border border-border rounded-2xl p-4 shadow-sm">
              <summary className="font-semibold cursor-pointer flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                سياسات المتجر 📋
              </summary>
              <div className="mt-3 space-y-4 text-sm">
                {storePolicies.return_policy && (
                  <div>
                    <h4 className="font-bold mb-1">🔄 سياسة الاسترجاع</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{storePolicies.return_policy}</p>
                  </div>
                )}
                {storePolicies.shipping_policy && (
                  <div>
                    <h4 className="font-bold mb-1">🚚 سياسة الشحن</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{storePolicies.shipping_policy}</p>
                  </div>
                )}
                {storePolicies.privacy_policy && (
                  <div>
                    <h4 className="font-bold mb-1">🔒 سياسة الخصوصية</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{storePolicies.privacy_policy}</p>
                  </div>
                )}
              </div>
            </details>
          )}
          <Link to="/track">
            <Button variant="outline" size="sm" className="rounded-full">
              <Truck className="h-4 w-4 ml-1" />تتبع طلبك
            </Button>
          </Link>
        </div>
      </section>

      {/* Complaint */}
      <section className="container pb-6">
        <details className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <summary className="font-semibold cursor-pointer flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            عندك مشكلة أو عايز تسأل عن حاجة؟ 🤔
          </summary>
          <ComplaintForm storeId={store.id} storeName={store.store_name} whatsappNumber={store.whatsapp_number} />
        </details>
      </section>

      {store.facebook_pixel && (
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${store.facebook_pixel}');fbq('track','PageView');` }} />
      )}

      {/* WhatsApp Float */}
      <WhatsAppFloat phone={store.whatsapp_number} />

      <AlshbhWatermark />
    </div>
  );
}

function ComplaintForm({ storeId, storeName, whatsappNumber }: { storeId: string; storeName: string; whatsappNumber?: string }) {
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
      name, phone: phone || null, message,
      store_id: storeId,
      store_name: storeName,
    });
    if (error) toast({ title: "حصلت مشكلة يسطا 😕", variant: "destructive" });
    else { setSent(true); toast({ title: "تمام! وصلتنا رسالتك ✅" }); }
    setSending(false);
  };

  if (sent) return <p className="text-sm text-green-600 mt-3">تمام يا اخويا! وصلتنا رسالتك وهنرد عليك في أقرب وقت 🙏</p>;

  return (
    <div className="mt-4 space-y-3">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك إيه يسطا؟" className="rounded-xl" />
      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم موبايلك (لو عايز نكلمك)" dir="ltr" className="rounded-xl" />
      <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="قولنا إيه اللي حصل يا اخويا..." className="rounded-xl" />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={sending} className="rounded-xl">{sending ? "بنبعت..." : "ابعت 📩"}</Button>
        {whatsappNumber && (
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank">
            <Button size="sm" variant="outline" className="rounded-xl"><MessageCircle className="h-4 w-4 ml-1" />كلمنا واتساب</Button>
          </a>
        )}
      </div>
    </div>
  );
}

