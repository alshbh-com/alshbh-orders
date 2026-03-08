import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart, Search, Star, Plus, Minus, Trash2, MessageCircle, Share2, X, AlertTriangle, Tag, Sparkles, TrendingUp, MapPin } from "lucide-react";
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

        const [productsRes, categoriesRes, reviewsRes, shippingRes] = await Promise.all([
          supabase.from("products").select("*").eq("store_id", storeData.id).eq("is_active", true),
          supabase.from("categories").select("*").eq("store_id", storeData.id).order("sort_order"),
          supabase.from("reviews").select("*").in("product_id",
            (await supabase.from("products").select("id").eq("store_id", storeData.id)).data?.map(p => p.id) || []
          ),
          supabase.from("store_shipping").select("*").eq("store_id", storeData.id).eq("is_active", true),
        ]);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
        setReviews(reviewsRes.data || []);
        setStoreShipping(shippingRes.data || []);
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

  // Get shipping cost based on selected governorate
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
    if (store.points_balance <= 0) {
      toast({ title: "المتجر ده مش بيستقبل طلبات دلوقتي 😕", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const addressWithGov = selectedGovernorate ? `${selectedGovernorate} - ${customerAddress}` : customerAddress;
      const { data: order, error } = await supabase.from("orders").insert({
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: addressWithGov,
        customer_notes: customerNotes || null,
        total_price: cartTotal,
        shipping_cost: shippingCost,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: discountAmount,
      }).select().single();
      if (error) throw error;

      if (appliedCoupon) {
        await supabase.from("coupons").update({ used_count: appliedCoupon.used_count + 1 }).eq("id", appliedCoupon.id);
      }

      const items = cart.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        price: i.product.discount_price || i.product.price,
        selected_size: i.selectedSize || null,
        selected_color: i.selectedColor || null,
      }));
      await supabase.from("order_items").insert(items);

      setOrderSuccess(order.id);
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      localStorage.removeItem(`cart_${store.id}`);
    } catch (e: any) {
      toast({ title: "حصلت مشكلة يسطا 😕", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const getAvgRating = (productId: string) => {
    const r = reviews.filter(rv => rv.product_id === productId);
    return r.length ? (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1) : null;
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

  const storeStyle = {
    "--store-primary": store.primary_color || "#D97706",
    "--store-secondary": store.secondary_color || "#F59E0B",
  } as React.CSSProperties;

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30" style={storeStyle}>
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ 
          background: `linear-gradient(135deg, ${store.primary_color || '#D97706'}, ${store.secondary_color || '#F59E0B'}, ${store.primary_color || '#D97706'})`,
          backgroundSize: '200% 200%',
        }} />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container py-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20 rounded-full" onClick={shareStore}>
                <Share2 className="h-5 w-5" />
              </Button>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20 rounded-full">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </a>
              )}
            </div>
            <Button 
              className="relative rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-5 w-5 ml-1" />
              السلة
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-xs flex items-center justify-center font-bold" style={{ color: store.primary_color || '#D97706' }}>
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
                <Store className="h-9 w-9" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{store.store_name}</h1>
              <p className="text-white/70 mt-1">أهلاً بيك يا حبيبي! نورتنا 😍</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  {products.length} منتج
                </Badge>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  🚚 توصيل لكل مصر
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container -mt-5 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="دوّر على اللي عايزه... 🔍" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-10 border-0 bg-muted/50 rounded-xl h-11" 
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="container mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button 
              size="sm" 
              variant={!selectedCategory ? "default" : "outline"} 
              onClick={() => setSelectedCategory(null)}
              className="rounded-full whitespace-nowrap shrink-0"
            >
              الكل 🔥
            </Button>
            {categories.map(c => (
              <Button 
                key={c.id} 
                size="sm" 
                variant={selectedCategory === c.id ? "default" : "outline"} 
                onClick={() => setSelectedCategory(c.id)}
                className="rounded-full whitespace-nowrap shrink-0"
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${store.primary_color}20` }}>
              <Sparkles className="h-4 w-4" style={{ color: store.primary_color }} />
            </div>
            <h2 className="text-lg font-bold">الحاجات المميزة 🌟</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-44 shrink-0">
                <ProductCard product={p} avgRating={getAvgRating(p.id)} onClick={() => navigate(`/store/${slug}/product/${p.id}`)} storeColor={store.primary_color} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && bestSellers[0].sales_count > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-destructive" />
            </div>
            <h2 className="text-lg font-bold">الناس بتحب دول 🔥</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} avgRating={getAvgRating(p.id)} onClick={() => navigate(`/store/${slug}/product/${p.id}`)} storeColor={store.primary_color} />
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <main className="flex-1 container py-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "كل المنتجات 🛍️"}
          </h2>
          <Badge variant="secondary" className="rounded-full">{filteredProducts.length} منتج</Badge>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <ShoppingCart className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-1">مفيش حاجة هنا 😅</h2>
            <p className="text-sm text-muted-foreground">جرب تدور بكلمة تانية يسطا</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} avgRating={getAvgRating(p.id)} onClick={() => navigate(`/store/${slug}/product/${p.id}`)} storeColor={store.primary_color} />
            ))}
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

function ProductCard({ product, avgRating, onClick, storeColor }: {
  product: any; avgRating: string | null; onClick: () => void; storeColor?: string;
}) {
  const finalPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.discount_price / product.price) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 bg-card cursor-pointer group hover:-translate-y-0.5" onClick={onClick}>
      <div className="relative overflow-hidden">
        {product.main_image_url ? (
          <img src={product.main_image_url} alt={product.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground border-0 rounded-lg text-xs">
            -{discountPercent}%
          </Badge>
        )}
        {product.is_featured && (
          <Badge className="absolute top-2 right-2 border-0 rounded-lg text-xs" style={{ backgroundColor: storeColor || '#D97706', color: 'white' }}>
            ⭐ مميز
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
        {product.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{product.description}</p>}
        {avgRating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold">{avgRating}</span>
          </div>
        )}
        {product.stock !== null && product.stock <= 0 && (
          <Badge variant="destructive" className="text-xs mb-2 rounded-lg">خلص يسطا 😅</Badge>
        )}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: storeColor || "var(--store-primary)" }}>{finalPrice} جنيه</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">{product.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}
