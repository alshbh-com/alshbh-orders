import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart, Search, Star, Plus, Minus, Trash2, MessageCircle, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

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
        // Load cart from localStorage
        const savedCart = localStorage.getItem(`cart_${storeData.id}`);
        if (savedCart) {
          try { setCart(JSON.parse(savedCart)); } catch {}
        }

        const [productsRes, categoriesRes, reviewsRes] = await Promise.all([
          supabase.from("products").select("*").eq("store_id", storeData.id).eq("is_active", true),
          supabase.from("categories").select("*").eq("store_id", storeData.id).order("sort_order"),
          supabase.from("reviews").select("*").in("product_id",
            (await supabase.from("products").select("id").eq("store_id", storeData.id)).data?.map(p => p.id) || []
          ),
        ]);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
        setReviews(reviewsRes.data || []);
      }
      setLoading(false);
    };
    fetchStore();
  }, [slug]);

  // Sync cart to localStorage
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
  

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.selectedSize && !i.selectedColor);
      if (existing) return prev.map(i => i.product.id === product.id && !i.selectedSize && !i.selectedColor ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    toast({ title: "تم الإضافة للسلة", description: product.name });
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((i, idx) => idx === index ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const shippingCost = store?.shipping_cost || 70;
  const cartSubtotal = cart.reduce((sum, i) => sum + (i.product.discount_price || i.product.price) * i.quantity, 0);
  const cartTotal = cartSubtotal + shippingCost;

  const submitOrder = async () => {
    if (!customerName || !customerPhone || !customerAddress || cart.length === 0) return;
    if (store.points_balance <= 0) {
      toast({ title: "المتجر مش بيستقبل طلبات دلوقتي", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_notes: customerNotes || null,
        total_price: cartTotal,
        shipping_cost: shippingCost,
      }).select().single();
      if (error) throw error;

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
      toast({ title: "حصل مشكلة", description: e.message, variant: "destructive" });
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
      toast({ title: "تم نسخ رابط المتجر 📋" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">المتجر مش موجود</h1>
        <p className="text-muted-foreground">ممكن يكون الرابط غلط أو المتجر متوقف</p>
      </div>
    );
  }

  // Store inactive (no points)
  if (store.points_balance <= 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{store.store_name}</h1>
        <p className="text-muted-foreground">المتجر مش بيستقبل طلبات حالياً — رصيد النقاط خلص</p>
        <AlshbhWatermark />
      </div>
    );
  }

  // Order success
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold">تم تسجيل طلبك بنجاح!</h1>
          <p className="text-muted-foreground">رقم الطلب: <span className="font-mono font-bold">{orderSuccess.slice(0, 8)}</span></p>
          <p className="text-muted-foreground">هيتم التواصل معاك قريب</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setOrderSuccess(null)}>ارجع للمتجر</Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`مرحباً، أنا عملت طلب رقم ${orderSuccess.slice(0, 8)}`)}`} target="_blank">
                <Button variant="outline"><MessageCircle className="h-4 w-4 ml-1" />واتساب</Button>
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
      <header className="text-white py-6" style={{ background: `linear-gradient(to left, ${store.primary_color}, ${store.secondary_color})` }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-14 w-14 rounded-xl object-cover bg-white/10" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Store className="h-7 w-7" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{store.store_name}</h1>
              <p className="text-sm opacity-80">مرحبًا بيك في متجرنا</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={shareStore}>
              <Share2 className="h-5 w-5" />
            </Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </a>
            )}
            <Button variant="secondary" className="relative" onClick={() => setShowCart(true)}>
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="container py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={!selectedCategory ? "default" : "outline"} onClick={() => setSelectedCategory(null)}>الكل</Button>
          {categories.map(c => (
            <Button key={c.id} size="sm" variant={selectedCategory === c.id ? "default" : "outline"} onClick={() => setSelectedCategory(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mb-6">
          <h2 className="text-xl font-bold mb-3">⭐ منتجات مميزة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} avgRating={getAvgRating(p.id)} onClick={() => navigate(`/store/${slug}/product/${p.id}`)} />
            ))}
          </div>
        </section>
      )}


      {/* Best sellers */}
      {bestSellers.length > 0 && bestSellers[0].sales_count > 0 && !searchQuery && !selectedCategory && (
        <section className="container mb-6">
          <h2 className="text-xl font-bold mb-3">🔥 الأكثر مبيعاً</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} avgRating={getAvgRating(p.id)} onClick={() => navigate(`/store/${slug}/product/${p.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <main className="flex-1 container pb-8">
        <h2 className="text-xl font-bold mb-3">
          {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "كل المنتجات"} ({filteredProducts.length})
        </h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">مفيش منتجات</h2>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} avgRating={getAvgRating(p.id)} onClick={() => navigate(`/store/${slug}/product/${p.id}`)} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>سلة المشتريات ({cart.length})</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">السلة فاضية</p>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 border-b border-border pb-3">
                    {item.product.main_image_url ? (
                      <img src={item.product.main_image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.product.name}</h4>
                      {item.selectedSize && <p className="text-xs text-muted-foreground">المقاس: {item.selectedSize}</p>}
                      {item.selectedColor && <p className="text-xs text-muted-foreground">اللون: {item.selectedColor}</p>}
                      <p className="text-sm text-primary font-bold">{item.product.discount_price || item.product.price} جنيه</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateCartQuantity(idx, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateCartQuantity(idx, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeFromCart(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>المنتجات</span>
                    <span>{cartSubtotal} جنيه</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>التوصيل</span>
                    <span>{shippingCost} جنيه</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>الإجمالي</span>
                    <span className="text-primary">{cartTotal} جنيه</span>
                  </div>
                  <Button className="w-full mt-3" onClick={() => { setShowCart(false); setShowCheckout(true); }}>
                    إتمام الطلب
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader><DialogTitle>إتمام الطلب</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
              <Input value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="أي ملاحظات على الطلب..." />
            </div>
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>المنتجات</span><span>{cartSubtotal} جنيه</span></div>
              <div className="flex justify-between"><span>التوصيل</span><span>{shippingCost} جنيه</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>الإجمالي</span>
                <span className="text-primary">{cartTotal} جنيه</span>
              </div>
            </div>
            <Button className="w-full" onClick={submitOrder} disabled={submitting}>
              {submitting ? "جاري التسجيل..." : "تأكيد الطلب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint / Contact section */}
      <section className="container pb-6">
        <details className="border border-border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">📩 عندك شكوى أو استفسار؟</summary>
          <ComplaintForm storeId={store.id} storeName={store.store_name} whatsappNumber={store.whatsapp_number} />
        </details>
      </section>

      {/* Inject tracking pixels */}
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
      name, phone: phone || null, message: `[متجر: ${storeName}] ${message}`,
    });
    if (error) toast({ title: "حصل مشكلة", variant: "destructive" });
    else { setSent(true); toast({ title: "تم إرسال شكواك ✅" }); }
    setSending(false);
  };

  if (sent) return <p className="text-sm text-green-600 mt-3">تم الإرسال بنجاح — هنتواصل معاك قريب 🙏</p>;

  return (
    <div className="mt-3 space-y-3">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك" />
      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم موبايلك (اختياري)" dir="ltr" />
      <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب شكواك أو استفسارك..." />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={sending}>{sending ? "جاري الإرسال..." : "ابعت"}</Button>
        {whatsappNumber && (
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank">
            <Button size="sm" variant="outline"><MessageCircle className="h-4 w-4 ml-1" />واتساب</Button>
          </a>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, avgRating, onClick }: {
  product: any; avgRating: string | null; onClick: () => void;
}) {
  const finalPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <div className="rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow bg-card cursor-pointer" onClick={onClick}>
      {product.main_image_url ? (
        <img src={product.main_image_url} alt={product.name} className="w-full h-44 object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-44 bg-muted flex items-center justify-center">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
        {product.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>}
        {avgRating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold">{avgRating}</span>
          </div>
        )}
        {product.stock !== null && product.stock <= 0 && (
          <Badge variant="destructive" className="text-xs mb-2">غير متوفر</Badge>
        )}
        <div>
          <span className="text-base font-bold" style={{ color: "var(--store-primary)" }}>{finalPrice} جنيه</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through mr-1">{product.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}
