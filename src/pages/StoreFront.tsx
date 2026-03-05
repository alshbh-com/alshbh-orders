import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart, Search, Star, X, Plus, Minus, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface CartItem {
  product: any;
  quantity: number;
}

const themeStyles: Record<string, { headerBg: string; accent: string; cardStyle: string }> = {
  restaurants: { headerBg: "bg-gradient-to-l from-orange-600 to-red-600", accent: "text-orange-600", cardStyle: "rounded-2xl" },
  clothing: { headerBg: "bg-gradient-to-l from-pink-600 to-purple-600", accent: "text-purple-600", cardStyle: "rounded-xl" },
  perfumes: { headerBg: "bg-gradient-to-l from-yellow-700 to-amber-900", accent: "text-amber-800", cardStyle: "rounded-lg" },
  supermarket: { headerBg: "bg-gradient-to-l from-green-600 to-teal-600", accent: "text-green-600", cardStyle: "rounded-xl" },
};

export default function StoreFront() {
  const { slug } = useParams<{ slug: string }>();
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
  const [showReview, setShowReview] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores").select("*").eq("store_slug", slug).eq("is_active", true).maybeSingle();

      if (storeData) {
        setStore(storeData);
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
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    toast({ title: "تم الإضافة للسلة", description: product.name });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

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
        total_price: cartTotal,
      }).select().single();
      if (error) throw error;

      const items = cart.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
      }));
      await supabase.from("order_items").insert(items);

      toast({ title: "تم تسجيل طلبك بنجاح! 🎉", description: "هيتم التواصل معاك قريب" });
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    } catch (e: any) {
      toast({ title: "حصل مشكلة", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitReview = async () => {
    if (!showReview || !reviewName || !reviewRating) return;
    await supabase.from("reviews").insert({
      product_id: showReview,
      customer_name: reviewName,
      rating: reviewRating,
      comment: reviewComment || null,
    });
    toast({ title: "شكراً لتقييمك! ⭐" });
    setShowReview(null);
    setReviewName("");
    setReviewRating(5);
    setReviewComment("");
    // Refresh reviews
    const { data } = await supabase.from("reviews").select("*").in("product_id", products.map(p => p.id));
    setReviews(data || []);
  };

  const getProductReviews = (productId: string) => reviews.filter(r => r.product_id === productId);
  const getAvgRating = (productId: string) => {
    const r = getProductReviews(productId);
    return r.length ? (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1) : null;
  };

  const theme = themeStyles[store?.theme || "restaurants"] || themeStyles.restaurants;

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

  const storeStyle = {
    "--store-primary": store.primary_color || "#D97706",
    "--store-secondary": store.secondary_color || "#F59E0B",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex flex-col" style={storeStyle}>
      {/* Header */}
      <header className={`${theme.headerBg} text-white py-6`} style={{ background: `linear-gradient(to left, ${store.primary_color}, ${store.secondary_color})` }}>
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
          <Button variant="secondary" className="relative" onClick={() => setShowCart(true)}>
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="container py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
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
      {featuredProducts.length > 0 && (
        <section className="container mb-6">
          <h2 className="text-xl font-bold mb-3">⭐ منتجات مميزة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} theme={theme} addToCart={addToCart} avgRating={getAvgRating(p.id)} onReview={() => setShowReview(p.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && bestSellers[0].sales_count > 0 && (
        <section className="container mb-6">
          <h2 className="text-xl font-bold mb-3">🔥 الأكثر مبيعاً</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} theme={theme} addToCart={addToCart} avgRating={getAvgRating(p.id)} onReview={() => setShowReview(p.id)} />
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
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} theme={theme} addToCart={addToCart} avgRating={getAvgRating(p.id)} onReview={() => setShowReview(p.id)} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>سلة المشتريات ({cart.length})</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">السلة فاضية</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 border-b border-border pb-3">
                    {item.product.main_image_url ? (
                      <img src={item.product.main_image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.product.name}</h4>
                      <p className="text-sm text-primary font-bold">{item.product.price} جنيه</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-lg">
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
          <DialogHeader>
            <DialogTitle>إتمام الطلب</DialogTitle>
          </DialogHeader>
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
            <div className="border-t border-border pt-3">
              <p className="font-bold text-lg text-center">الإجمالي: <span className="text-primary">{cartTotal} جنيه</span></p>
            </div>
            <Button className="w-full" onClick={submitOrder} disabled={submitting}>
              {submitting ? "جاري التسجيل..." : "تأكيد الطلب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!showReview} onOpenChange={(o) => !o && setShowReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>قيّم المنتج ⭐</DialogTitle>
          </DialogHeader>
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

function ProductCard({ product, theme, addToCart, avgRating, onReview }: {
  product: any; theme: any; addToCart: (p: any) => void; avgRating: string | null; onReview: () => void;
}) {
  return (
    <div className={`${theme.cardStyle} border border-border overflow-hidden hover:shadow-lg transition-shadow bg-card`}>
      {product.main_image_url ? (
        <img src={product.main_image_url} alt={product.name} className="w-full h-44 object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-44 bg-muted flex items-center justify-center">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
        {product.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>}
        {avgRating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold">{avgRating}</span>
            <button onClick={onReview} className="text-xs text-primary hover:underline mr-auto">قيّم</button>
          </div>
        )}
        {!avgRating && (
          <button onClick={onReview} className="text-xs text-primary hover:underline mb-2 block">⭐ قيّم المنتج</button>
        )}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: "var(--store-primary)" }}>{product.price} جنيه</span>
          <Button size="sm" className="text-xs" onClick={() => addToCart(product)}>أضف للسلة</Button>
        </div>
      </div>
    </div>
  );
}
