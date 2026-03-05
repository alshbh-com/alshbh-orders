import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Package, ShoppingCart, Coins, Store, Settings, Plus, Trash2, Edit, Eye,
  Upload, X, Check, Clock, Truck, XCircle, Image as ImageIcon, Palette
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create store form
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category form
  const [newCategory, setNewCategory] = useState("");

  // Store settings
  const [editStoreName, setEditStoreName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editPrimaryColor, setEditPrimaryColor] = useState("");
  const [editSecondaryColor, setEditSecondaryColor] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user!.id)
      .maybeSingle();

    if (storeData) {
      setStore(storeData);
      setEditStoreName(storeData.store_name);
      setEditWhatsapp(storeData.whatsapp_number || "");
      setEditTheme(storeData.theme || "restaurants");
      setEditPrimaryColor(storeData.primary_color || "#D97706");
      setEditSecondaryColor(storeData.secondary_color || "#F59E0B");

      const [productsRes, ordersRes, categoriesRes, transRes, templatesRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, order_items(*, products(name))").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("store_id", storeData.id).order("sort_order"),
        supabase.from("point_transactions").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("templates").select("*"),
      ]);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setCategories(categoriesRes.data || []);
      setTransactions(transRes.data || []);
      setTemplates(templatesRes.data || []);
    }
    setLoading(false);
  };

  const createStore = async () => {
    if (!storeName || !storeSlug) return;
    const slug = storeSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const { error } = await supabase.from("stores").insert({
      owner_id: user!.id,
      store_name: storeName,
      store_slug: slug,
      whatsapp_number: whatsappNumber,
    });
    if (error) {
      toast({ title: "حصل مشكلة", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إنشاء المتجر!" });
      setShowCreateStore(false);
      fetchData();
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(name, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(name);
    return data.publicUrl;
  };

  const saveProduct = async () => {
    if (!productName || !productPrice || !store) return;
    setSavingProduct(true);
    try {
      let imageUrl = editingProduct?.main_image_url || null;
      if (productImage) {
        imageUrl = await uploadImage(productImage, store.id);
      }

      const productData = {
        store_id: store.id,
        name: productName,
        description: productDesc || null,
        price: parseFloat(productPrice),
        category_id: productCategory || null,
        main_image_url: imageUrl,
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(productData).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // Upload additional images
      for (const img of additionalImages) {
        const url = await uploadImage(img, store.id);
        await supabase.from("product_images").insert({ product_id: productId, image_url: url });
      }

      toast({ title: editingProduct ? "تم تعديل المنتج" : "تم إضافة المنتج" });
      resetProductForm();
      fetchData();
    } catch (e: any) {
      toast({ title: "حصل مشكلة", description: e.message, variant: "destructive" });
    }
    setSavingProduct(false);
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      toast({ title: "تم حذف المنتج" });
      fetchData();
    }
  };

  const resetProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductName("");
    setProductDesc("");
    setProductPrice("");
    setProductCategory("");
    setProductImage(null);
    setProductImagePreview("");
    setAdditionalImages([]);
  };

  const startEditProduct = (p: any) => {
    setEditingProduct(p);
    setProductName(p.name);
    setProductDesc(p.description || "");
    setProductPrice(String(p.price));
    setProductCategory(p.category_id || "");
    setProductImagePreview(p.main_image_url || "");
    setShowProductForm(true);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (!error) {
      toast({ title: "تم تحديث حالة الطلب" });
      fetchData();
    }
  };

  const addCategory = async () => {
    if (!newCategory || !store) return;
    const { error } = await supabase.from("categories").insert({ store_id: store.id, name: newCategory });
    if (!error) {
      setNewCategory("");
      fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    fetchData();
  };

  const saveStoreSettings = async () => {
    if (!store) return;
    setSavingSettings(true);
    const { error } = await supabase.from("stores").update({
      store_name: editStoreName,
      whatsapp_number: editWhatsapp,
      theme: editTheme,
      primary_color: editPrimaryColor,
      secondary_color: editSecondaryColor,
    }).eq("id", store.id);
    if (!error) toast({ title: "تم حفظ الإعدادات" });
    else toast({ title: "حصل مشكلة", description: error.message, variant: "destructive" });
    setSavingSettings(false);
    fetchData();
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const whatsappUrl = "https://wa.me/201061067966?text=" + encodeURIComponent("أريد شحن نقاط لمنصة ALSHBH");

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: "جديد", color: "bg-blue-100 text-blue-700", icon: Clock },
    processing: { label: "قيد التجهيز", color: "bg-yellow-100 text-yellow-700", icon: Package },
    delivered: { label: "تم التوصيل", color: "bg-green-100 text-green-700", icon: Truck },
    cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: XCircle },
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  // No store - show create store form
  if (!store) {
    return (
      <Layout>
        <div className="container py-12 max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <Store className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>اعمل متجرك دلوقتي!</CardTitle>
              <p className="text-muted-foreground">اكتب بيانات متجرك وابدأ استقبل طلبات</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المتجر</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="مثال: مطعم الشبح" />
              </div>
              <div className="space-y-2">
                <Label>رابط المتجر (بالإنجليزي)</Label>
                <Input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} placeholder="مثال: alshbh-restaurant" dir="ltr" />
                <p className="text-xs text-muted-foreground">هيبقى الرابط: alshbh.store/store/{storeSlug || "اسم-متجرك"}</p>
              </div>
              <div className="space-y-2">
                <Label>رقم الواتساب</Label>
                <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="201xxxxxxxxx" dir="ltr" />
              </div>
              <Button className="w-full" onClick={createStore}>إنشاء المتجر</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">لوحة التحكم - {store.store_name}</h1>
            <p className="text-muted-foreground">إدارة متجرك ومنتجاتك وطلباتك</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base px-4 py-1">
              <Coins className="h-4 w-4 ml-1" />
              {store.points_balance} نقطة
            </Badge>
            <a href={`/store/${store.store_slug}`} target="_blank">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4 ml-1" />شوف المتجر</Button>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Package, label: "المنتجات", value: products.length },
            { icon: ShoppingCart, label: "الطلبات", value: orders.length },
            { icon: ShoppingCart, label: "طلبات جديدة", value: orders.filter(o => o.status === "new").length },
            { icon: Coins, label: "رصيد النقاط", value: store.points_balance },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="categories">التصنيفات</TabsTrigger>
            <TabsTrigger value="points">النقاط</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">منتجاتك ({products.length})</h2>
              <Button onClick={() => { resetProductForm(); setShowProductForm(true); }}>
                <Plus className="h-4 w-4 ml-1" />ضيف منتج
              </Button>
            </div>

            {/* Product Form Dialog */}
            <Dialog open={showProductForm} onOpenChange={(o) => { if (!o) resetProductForm(); }}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "تعديل المنتج" : "ضيف منتج جديد"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>اسم المنتج</Label>
                    <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="اسم المنتج" />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="وصف المنتج..." />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر (جنيه)</Label>
                    <Input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>التصنيف</Label>
                    <Select value={productCategory} onValueChange={setProductCategory}>
                      <SelectTrigger><SelectValue placeholder="اختار تصنيف" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>صورة المنتج الرئيسية</Label>
                    {productImagePreview && (
                      <img src={productImagePreview} alt="preview" className="w-32 h-32 object-cover rounded-lg" />
                    )}
                    <Input type="file" accept="image/*" onChange={handleMainImageChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>صور إضافية</Label>
                    <Input type="file" accept="image/*" multiple onChange={(e) => setAdditionalImages(Array.from(e.target.files || []))} />
                    {additionalImages.length > 0 && (
                      <p className="text-xs text-muted-foreground">{additionalImages.length} صور محددة</p>
                    )}
                  </div>
                  <Button className="w-full" onClick={saveProduct} disabled={savingProduct}>
                    {savingProduct ? "جاري الحفظ..." : editingProduct ? "حفظ التعديلات" : "ضيف المنتج"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">مفيش منتجات لسه — ضيف أول منتج!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <Card key={p.id} className="overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{p.name}</h3>
                        <span className="font-bold text-primary">{p.price} جنيه</span>
                      </div>
                      {p.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditProduct(p)}>
                          <Edit className="h-3 w-3 ml-1" />تعديل
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)}>
                          <Trash2 className="h-3 w-3 ml-1" />حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-lg font-semibold">الطلبات ({orders.length})</h2>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">مفيش طلبات لسه</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const s = statusMap[order.status] || statusMap.new;
                  return (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{order.customer_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">📱 {order.customer_phone}</p>
                            <p className="text-sm text-muted-foreground">📍 {order.customer_address}</p>
                            <p className="text-sm font-semibold text-primary">الإجمالي: {order.total_price} جنيه</p>
                            {order.order_items?.map((item: any, i: number) => (
                              <p key={i} className="text-xs text-muted-foreground">
                                • {item.products?.name || "منتج"} × {item.quantity} = {item.price * item.quantity} جنيه
                              </p>
                            ))}
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("ar-EG")}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {["new", "processing", "delivered", "cancelled"].map((st) => (
                              <Button
                                key={st}
                                size="sm"
                                variant={order.status === st ? "default" : "outline"}
                                className="text-xs"
                                onClick={() => updateOrderStatus(order.id, st)}
                              >
                                {statusMap[st].label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <h2 className="text-lg font-semibold">التصنيفات</h2>
            <div className="flex gap-2">
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="اسم التصنيف الجديد" />
              <Button onClick={addCategory}><Plus className="h-4 w-4 ml-1" />ضيف</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={c.id} variant="secondary" className="text-sm px-3 py-1.5 gap-2">
                  {c.name}
                  <button onClick={() => deleteCategory(c.id)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {categories.length === 0 && <p className="text-muted-foreground text-sm">مفيش تصنيفات لسه</p>}
            </div>
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="points" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  رصيد النقاط: {store.points_balance} نقطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">كل طلب بيخصم نقطة واحدة. لو رصيدك خلص مش هتقدر تستقبل طلبات.</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                  {[100, 200, 300, 500, 1000].map((p) => (
                    <a key={p} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <Card className="text-center hover:border-primary/40 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <div className="font-bold text-primary text-lg">{p}</div>
                          <div className="text-xs text-muted-foreground">نقطة</div>
                          <div className="text-sm font-semibold mt-1">{p} جنيه</div>
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">شحن نقاط عبر الواتساب</Button>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>سجل العمليات</CardTitle></CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">مفيش عمليات لسه</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex justify-between items-center text-sm border-b border-border pb-2">
                        <div>
                          <p>{t.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ar-EG")}</p>
                        </div>
                        <span className={`font-bold ${t.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                          {t.amount > 0 ? "+" : ""}{t.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>إعدادات المتجر</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم المتجر</Label>
                  <Input value={editStoreName} onChange={(e) => setEditStoreName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>رقم الواتساب</Label>
                  <Input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>القالب</Label>
                  <Select value={editTheme} onValueChange={setEditTheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اللون الأساسي</Label>
                    <Input type="color" value={editPrimaryColor} onChange={(e) => setEditPrimaryColor(e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>اللون الثانوي</Label>
                    <Input type="color" value={editSecondaryColor} onChange={(e) => setEditSecondaryColor(e.target.value)} className="h-10" />
                  </div>
                </div>
                <Button onClick={saveStoreSettings} disabled={savingSettings} className="w-full">
                  {savingSettings ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
