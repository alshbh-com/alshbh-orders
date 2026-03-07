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
  Package, ShoppingCart, Coins, Store, Plus, Trash2, Edit, Eye,
  X, Check, Clock, Truck, XCircle, Image as ImageIcon, Search, Megaphone, Bell
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const COLORS = ["أسود", "أبيض", "أحمر", "أزرق", "أخضر", "رمادي"];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allStores, setAllStores] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [storeShipping, setStoreShipping] = useState<any[]>([]);
  const [savingShipping, setSavingShipping] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // Create store form
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [storeShippingCost, setStoreShippingCost] = useState("70");
  const [newStorePrimaryColor, setNewStorePrimaryColor] = useState("#D97706");
  const [newStoreSecondaryColor, setNewStoreSecondaryColor] = useState("#F59E0B");

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDiscountPrice, setProductDiscountPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);
  const [productSizes, setProductSizes] = useState<string[]>([]);
  const [productColors, setProductColors] = useState<string[]>([]);
  const [productFeatured, setProductFeatured] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category form
  const [newCategory, setNewCategory] = useState("");

  // Store settings
  const [editStoreName, setEditStoreName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editPrimaryColor, setEditPrimaryColor] = useState("");
  const [editSecondaryColor, setEditSecondaryColor] = useState("");
  const [editShippingCost, setEditShippingCost] = useState("");
  const [editFacebookPixel, setEditFacebookPixel] = useState("");
  const [editTiktokPixel, setEditTiktokPixel] = useState("");
  const [editGoogleAnalytics, setEditGoogleAnalytics] = useState("");
  const [editSnapchatPixel, setEditSnapchatPixel] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Order detail
  const [showOrderDetail, setShowOrderDetail] = useState<any>(null);

  // Register OneSignal external_id for push notifications
  const registerOneSignal = async () => {
    if (typeof window === 'undefined' || !(window as any).OneSignalDeferred) return;
    (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        await OneSignal.login(user!.id);
        console.log('OneSignal: registered external_id', user!.id);
      } catch (e) {
        console.log('OneSignal login error (expected on non-production domains):', e);
      }
    });
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !(window as any).OneSignalDeferred) {
      setShowNotifPrompt(false);
      return;
    }
    (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        await OneSignal.Notifications.requestPermission();
        await OneSignal.login(user!.id);
        toast({ title: "تم تفعيل الإشعارات! 🔔", description: "هتوصلك إشعارات لكل طلب جديد" });
      } catch (e) {
        console.log('OneSignal permission error:', e);
        toast({ title: "مقدرناش نفعّل الإشعارات", description: "حاول تاني من إعدادات المتصفح", variant: "destructive" });
      }
    });
    setShowNotifPrompt(false);
  };

  useEffect(() => {
    if (user) registerOneSignal();
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async (selectedStoreId?: string) => {
    setLoading(true);
    const { data: storesData } = await supabase.from("stores").select("*").eq("owner_id", user!.id).order("created_at");
    setAllStores(storesData || []);

    // Pick which store to show
    const storeData = selectedStoreId
      ? storesData?.find(s => s.id === selectedStoreId) || storesData?.[0] || null
      : store?.id
        ? storesData?.find(s => s.id === store.id) || storesData?.[0] || null
        : storesData?.[0] || null;

    if (storeData) {
      setStore(storeData);
      setEditStoreName(storeData.store_name);
      setEditWhatsapp(storeData.whatsapp_number || "");
      setEditTheme(storeData.theme || "restaurants");
      setEditPrimaryColor(storeData.primary_color || "#D97706");
      setEditSecondaryColor(storeData.secondary_color || "#F59E0B");
      setEditShippingCost(String(storeData.shipping_cost || 70));
      setEditFacebookPixel(storeData.facebook_pixel || "");
      setEditTiktokPixel(storeData.tiktok_pixel || "");
      setEditGoogleAnalytics(storeData.google_analytics || "");
      setEditSnapchatPixel(storeData.snapchat_pixel || "");

      const [productsRes, ordersRes, categoriesRes, transRes, templatesRes, notifRes, couponsRes, shippingRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, order_items(*, products(name))").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("store_id", storeData.id).order("sort_order"),
        supabase.from("point_transactions").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("templates").select("*"),
        supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("coupons").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("store_shipping").select("*").eq("store_id", storeData.id).order("governorate"),
      ]);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setCategories(categoriesRes.data || []);
      setTransactions(transRes.data || []);
      setTemplates(templatesRes.data || []);
      setNotifications(notifRes.data || []);
      setCoupons(couponsRes.data || []);
      setStoreShipping(shippingRes.data || []);
    }
    setLoading(false);
  };

  const createStore = async () => {
    if (!storeName || !storeSlug) return;
    if (allStores.length >= 4) {
      toast({ title: "وصلت الحد الأقصى", description: "مينفعش تضيف أكتر من 4 متاجر", variant: "destructive" });
      return;
    }
    const slug = storeSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const referralStoreId = localStorage.getItem("referral_store_id") || null;
    
    const { data: newStore, error } = await supabase.from("stores").insert({
      owner_id: user!.id, store_name: storeName, store_slug: slug,
      whatsapp_number: whatsappNumber,
      shipping_cost: parseFloat(storeShippingCost) || 70,
      primary_color: newStorePrimaryColor,
      secondary_color: newStoreSecondaryColor,
      referred_by: referralStoreId,
    } as any).select().single();
    if (error) {
      toast({ title: "حصل مشكلة", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إنشاء المتجر! 🎉 وأخدت 5 نقاط مجانية (5 أوردرات هدية)" });
      localStorage.removeItem("referral_store_id");
      setShowCreateStore(false);
      setStoreName(""); setStoreSlug(""); setWhatsappNumber("");
      setNewStorePrimaryColor("#D97706"); setNewStoreSecondaryColor("#F59E0B");
      fetchData(newStore?.id);
    }
  };

  const uploadImage = async (file: File, _folder: string) => {
    // Compress then upload to imgbb via edge function
    const compressedBlob = await compressImage(file);
    const base64 = await blobToBase64(compressedBlob);

    const res = await supabase.functions.invoke("upload-image", {
      body: { image: base64 },
    });

    if (res.error) throw new Error(res.error.message || "فشل رفع الصورة");
    if (res.data?.error) throw new Error(res.data.error);
    return res.data.url;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 800;
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) { height = (height / width) * MAX_SIZE; width = MAX_SIZE; }
          else { width = (width / height) * MAX_SIZE; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.75);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const saveProduct = async () => {
    if (!productName || !productPrice || !store) return;
    setSavingProduct(true);
    try {
      let imageUrl = editingProduct?.main_image_url || null;
      // Use pasted URL if provided, otherwise upload file
      if (productImageUrl.trim()) {
        imageUrl = productImageUrl.trim();
      } else if (productImage) {
        imageUrl = await uploadImage(productImage, store.id);
      }

      const productData: any = {
        store_id: store.id, name: productName, description: productDesc || null,
        price: parseFloat(productPrice), category_id: productCategory || null,
        main_image_url: imageUrl, is_featured: productFeatured,
        stock: productStock ? parseInt(productStock) : null,
        discount_price: productDiscountPrice ? parseFloat(productDiscountPrice) : null,
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

      // Upload additional image files
      for (const img of additionalImages) {
        const url = await uploadImage(img, store.id);
        await supabase.from("product_images").insert({ product_id: productId, image_url: url });
      }
      // Add additional image URLs
      for (const url of additionalImageUrls) {
        if (url.trim()) {
          await supabase.from("product_images").insert({ product_id: productId, image_url: url.trim() });
        }
      }

      // Save variants (sizes × colors)
      if (productSizes.length > 0 || productColors.length > 0) {
        // Delete old variants
        await supabase.from("product_variants").delete().eq("product_id", productId);
        const variants: any[] = [];
        const sizes = productSizes.length > 0 ? productSizes : [null];
        const colors = productColors.length > 0 ? productColors : [null];
        for (const size of sizes) {
          for (const color of colors) {
            variants.push({ product_id: productId, size, color, stock: 0 });
          }
        }
        if (variants.length > 0) await supabase.from("product_variants").insert(variants);
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
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "تم حذف المنتج" });
    fetchData();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("products").update({ is_featured: !current }).eq("id", id);
    fetchData();
  };

  const resetProductForm = () => {
    setShowProductForm(false); setEditingProduct(null);
    setProductName(""); setProductDesc(""); setProductPrice("");
    setProductDiscountPrice(""); setProductCategory(""); setProductStock("");
    setProductImage(null); setProductImagePreview(""); setProductImageUrl("");
    setAdditionalImages([]); setAdditionalImageUrls([]);
    setProductSizes([]); setProductColors([]); setProductFeatured(false);
  };

  const startEditProduct = async (p: any) => {
    setEditingProduct(p); setProductName(p.name);
    setProductDesc(p.description || ""); setProductPrice(String(p.price));
    setProductDiscountPrice(p.discount_price ? String(p.discount_price) : "");
    setProductCategory(p.category_id || ""); setProductStock(p.stock !== null ? String(p.stock) : "");
    setProductImagePreview(p.main_image_url || ""); setProductFeatured(p.is_featured || false);

    // Load variants
    const { data: variants } = await supabase.from("product_variants").select("*").eq("product_id", p.id);
    const sizes = [...new Set((variants || []).map(v => v.size).filter(Boolean))] as string[];
    const colors = [...new Set((variants || []).map(v => v.color).filter(Boolean))] as string[];
    setProductSizes(sizes);
    setProductColors(colors);
    setShowProductForm(true);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", orderId);
    toast({ title: "تم تحديث حالة الطلب" });
    fetchData();
  };

  const addCategory = async () => {
    if (!newCategory || !store) return;
    await supabase.from("categories").insert({ store_id: store.id, name: newCategory });
    setNewCategory(""); fetchData();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id); fetchData();
  };

  const saveStoreSettings = async () => {
    if (!store) return;
    setSavingSettings(true);
    const { error } = await supabase.from("stores").update({
      store_name: editStoreName, whatsapp_number: editWhatsapp,
      theme: editTheme, primary_color: editPrimaryColor,
      secondary_color: editSecondaryColor, shipping_cost: parseFloat(editShippingCost) || 70,
      facebook_pixel: editFacebookPixel || null, tiktok_pixel: editTiktokPixel || null,
      google_analytics: editGoogleAnalytics || null, snapchat_pixel: editSnapchatPixel || null,
    }).eq("id", store.id);
    if (!error) toast({ title: "تم حفظ الإعدادات" });
    else toast({ title: "حصل مشكلة", description: error.message, variant: "destructive" });
    setSavingSettings(false); fetchData();
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setProductImage(file); setProductImagePreview(URL.createObjectURL(file)); }
  };

  const whatsappUrl = "https://wa.me/201061067966?text=" + encodeURIComponent("أريد شحن نقاط لمنصة ALSHBH");

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: "جديد", color: "bg-blue-100 text-blue-700", icon: Clock },
    processing: { label: "قيد التجهيز", color: "bg-yellow-100 text-yellow-700", icon: Package },
    delivered: { label: "تم التوصيل", color: "bg-green-100 text-green-700", icon: Truck },
    cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: XCircle },
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter !== "all" && o.status !== orderFilter) return false;
    if (orderSearch && !o.customer_name.includes(orderSearch) && !o.customer_phone.includes(orderSearch)) return false;
    return true;
  });

  const totalSales = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0);

  if (loading) {
    return <Layout><div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></Layout>;
  }

  // Create store form content (reused in both no-store and dialog)
  const storeFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>اسم المتجر بتاعك</Label>
        <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="مثال: مطعم الشبح 🍔" />
      </div>
      <div className="space-y-2">
        <Label>رابط المتجر (بالإنجليزي)</Label>
        <Input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} placeholder="مثال: alshbh-restaurant" dir="ltr" />
        <p className="text-xs text-muted-foreground">هيبقى الرابط: alshbh.store/store/{storeSlug || "اسم-متجرك"}</p>
      </div>
      <div className="space-y-2">
        <Label>رقم الواتساب (عشان العملاء يكلموك)</Label>
        <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="201xxxxxxxxx" dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label>سعر التوصيل (جنيه)</Label>
        <Input type="number" value={storeShippingCost} onChange={(e) => setStoreShippingCost(e.target.value)} placeholder="70" dir="ltr" />
      </div>
      {/* Color Pickers with Live Preview */}
      <div className="space-y-2">
        <Label>ألوان المتجر 🎨</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">اللون الأساسي</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={newStorePrimaryColor} onChange={(e) => setNewStorePrimaryColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border border-border" />
              <Input value={newStorePrimaryColor} onChange={(e) => setNewStorePrimaryColor(e.target.value)} dir="ltr" className="flex-1 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">اللون الثانوي</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={newStoreSecondaryColor} onChange={(e) => setNewStoreSecondaryColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border border-border" />
              <Input value={newStoreSecondaryColor} onChange={(e) => setNewStoreSecondaryColor(e.target.value)} dir="ltr" className="flex-1 text-xs" />
            </div>
          </div>
        </div>
      </div>
      {/* Live Preview */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="py-4 px-4 text-white text-center" style={{ background: `linear-gradient(135deg, ${newStorePrimaryColor}, ${newStoreSecondaryColor})` }}>
          <Store className="h-8 w-8 mx-auto mb-1" />
          <p className="font-bold text-lg">{storeName || "اسم متجرك"}</p>
          <p className="text-white/70 text-xs">أهلاً بيك يا حبيبي! نورتنا 😍</p>
        </div>
        <div className="p-3 bg-card flex gap-2">
          <div className="h-8 rounded-full px-3 flex items-center text-white text-xs" style={{ backgroundColor: newStorePrimaryColor }}>الكل 🔥</div>
          <div className="h-8 rounded-full px-3 flex items-center text-xs border border-border">تصنيف</div>
          <div className="h-8 rounded-full px-3 flex items-center text-xs border border-border">تصنيف</div>
        </div>
      </div>
      <Button className="w-full h-11 text-base" onClick={createStore}>يلا نبدأ! 🎉</Button>
      <p className="text-xs text-center text-muted-foreground">💡 كل طلب = نقطة = جنيه واحد بس</p>
    </div>
  );

  if (!store) {
    return (
      <Layout>
        <div className="container py-12 max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <Store className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>يلا نعملك متجرك يسطا! 🚀</CardTitle>
              <p className="text-muted-foreground">اكتب بيانات متجرك وفي ثانيتين هتبقى جاهز تبيع</p>
            </CardHeader>
            <CardContent>{storeFormContent}</CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        {/* Store Switcher */}
        {allStores.length > 1 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {allStores.map(s => (
              <Button key={s.id} size="sm" variant={s.id === store.id ? "default" : "outline"}
                onClick={() => fetchData(s.id)} className="shrink-0">
                {s.store_name}
              </Button>
            ))}
            {allStores.length < 4 && (
              <Button size="sm" variant="ghost" onClick={() => setShowCreateStore(true)} className="shrink-0">
                <Plus className="h-4 w-4 ml-1" />متجر جديد
              </Button>
            )}
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">أهلاً يسطا! 👋 {store.store_name}</h1>
            <p className="text-muted-foreground">هنا بتدير كل حاجة في متجرك — منتجات وطلبات وكل الحاجات</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={store.points_balance > 0 ? "default" : "destructive"} className="text-base px-4 py-1">
              <Coins className="h-4 w-4 ml-1" />{store.points_balance} نقطة
            </Badge>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/store/${store.store_slug}`);
              toast({ title: "تم نسخ رابط المتجر يسطا! 📋" });
            }}>
              📋 انسخ رابط المتجر
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${store.id}`);
              toast({ title: "تم نسخ لينك الإحالة! 🎁" });
            }}>
              🎁 لينك الإحالة
            </Button>
            <a href={`/store/${store.store_slug}`} target="_blank">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4 ml-1" />شوف المتجر</Button>
            </a>
            {allStores.length < 4 && (
              <Button variant="outline" size="sm" onClick={() => setShowCreateStore(true)}>
                <Plus className="h-4 w-4 ml-1" />متجر جديد
              </Button>
            )}
          </div>
        </div>

        {/* Create New Store Dialog */}
        <Dialog open={showCreateStore} onOpenChange={setShowCreateStore}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>يلا نعمل متجر جديد! 🚀</DialogTitle>
            </DialogHeader>
            {storeFormContent}
          </DialogContent>
        </Dialog>

        {store.points_balance <= 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-destructive text-lg mb-1">⚠️ يسطا المتجر واقف!</h3>
                <p className="text-sm text-muted-foreground mb-1">النقاط بتاعتك خلصت يا اخويا. الموضوع بسيط — كل طلب بيجيلك بيخصم نقطة واحدة بس (يعني جنيه واحد).</p>
                <p className="text-sm text-muted-foreground mb-3">دلوقتي العملاء بتوعك لما يدخلوا المتجر هيلاقوا رسالة إن المتجر مش شغال 😕 اشحن نقاط وهيرجع يشتغل فوراً!</p>
                <div className="flex items-center gap-2">
                  <a href={whatsappUrl} target="_blank"><Button size="sm">اشحن نقاط دلوقتي 💰</Button></a>
                  <p className="text-xs text-muted-foreground">100 نقطة = 100 جنيه (يعني 100 طلب!)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats - compact ticker */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 shrink-0 bg-muted rounded-lg px-3 py-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">طلبات جديدة</span>
            <span className="font-bold text-sm">{orders.filter(o => o.status === "new").length}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 bg-muted rounded-lg px-3 py-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">النقاط</span>
            <span className={`font-bold text-sm ${store.points_balance > 0 ? "" : "text-destructive"}`}>{store.points_balance}</span>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="categories">التصنيفات</TabsTrigger>
            <TabsTrigger value="points">النقاط</TabsTrigger>
            <TabsTrigger value="marketing">التسويق</TabsTrigger>
            <TabsTrigger value="coupons">الكوبونات</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            <TabsTrigger value="shipping">المحافظات 📍</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">منتجاتك ({products.length})</h2>
              <Button onClick={() => { resetProductForm(); setShowProductForm(true); }}><Plus className="h-4 w-4 ml-1" />ضيف منتج</Button>
            </div>

            <Dialog open={showProductForm} onOpenChange={(o) => { if (!o) resetProductForm(); }}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingProduct ? "تعديل المنتج" : "ضيف منتج جديد"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>اسم المنتج</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="اسم المنتج" /></div>
                  <div className="space-y-2"><Label>الوصف</Label><Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="وصف المنتج..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>السعر (جنيه)</Label><Input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0" dir="ltr" /></div>
                    <div className="space-y-2"><Label>سعر الخصم (اختياري)</Label><Input type="number" value={productDiscountPrice} onChange={(e) => setProductDiscountPrice(e.target.value)} placeholder="0" dir="ltr" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>التصنيف</Label>
                      <Select value={productCategory} onValueChange={setProductCategory}>
                        <SelectTrigger><SelectValue placeholder="اختار تصنيف" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>المخزون (اختياري)</Label><Input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder="غير محدود" dir="ltr" /></div>
                  </div>

                  {/* Sizes */}
                  <div className="space-y-2">
                    <Label>المقاسات المتاحة</Label>
                    <div className="flex gap-2 flex-wrap">
                      {SIZES.map(s => (
                        <button key={s} onClick={() => setProductSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                          className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${productSizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-2">
                    <Label>الألوان المتاحة</Label>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setProductColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                          className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${productColors.includes(c) ? "border-primary bg-primary/10" : "border-border"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox checked={productFeatured} onCheckedChange={(v) => setProductFeatured(!!v)} id="featured" />
                    <Label htmlFor="featured">منتج مميز ⭐</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>صورة المنتج الرئيسية 📸</Label>
                    <p className="text-xs text-muted-foreground">ارفع صورة من جهازك (هتتضغط تلقائياً 💡) أو الصق لينك صورة من أي موقع</p>
                    {(productImagePreview || productImageUrl) && (
                      <img src={productImageUrl || productImagePreview} alt="preview" className="w-32 h-32 object-cover rounded-lg" />
                    )}
                    <Input type="file" accept="image/*" onChange={handleMainImageChange} />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">أو الصق لينك</span></div>
                    </div>
                    <Input value={productImageUrl} onChange={(e) => setProductImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>صور إضافية (لو عايز)</Label>
                    <Input type="file" accept="image/*" multiple onChange={(e) => setAdditionalImages(Array.from(e.target.files || []))} />
                    {additionalImages.length > 0 && <p className="text-xs text-muted-foreground">✅ {additionalImages.length} صور جاهزة للرفع</p>}
                    <Input placeholder="أو الصق لينكات صور إضافية (لينك في كل سطر)" value={additionalImageUrls.join("\n")}
                      onChange={(e) => setAdditionalImageUrls(e.target.value.split("\n"))} dir="ltr" />
                  </div>
                  <Button className="w-full" onClick={saveProduct} disabled={savingProduct}>
                    {savingProduct ? "جاري الحفظ..." : editingProduct ? "حفظ التعديلات" : "ضيف المنتج"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {products.length === 0 ? (
              <Card><CardContent className="p-12 text-center"><Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">مفيش منتجات لسه يسطا — يلا ضيف أول منتج! 🎯</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <Card key={p.id} className="overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-muted flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold truncate">{p.name}</h3>
                        {p.is_featured && <Badge className="text-xs">مميز</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-primary">{p.discount_price || p.price} جنيه</span>
                        {p.discount_price && <span className="text-xs text-muted-foreground line-through">{p.price}</span>}
                      </div>
                      {p.stock !== null && <p className="text-xs text-muted-foreground mb-2">المخزون: {p.stock}</p>}
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => startEditProduct(p)}><Edit className="h-3 w-3 ml-1" />تعديل</Button>
                        <Button size="sm" variant="outline" onClick={() => toggleFeatured(p.id, p.is_featured)}>
                          {p.is_featured ? "إلغاء تمييز" : "⭐ تمييز"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-semibold">الطلبات ({filteredOrders.length})</h2>
              <div className="flex gap-2 flex-wrap">
                {["all", "new", "processing", "delivered", "cancelled"].map(f => (
                  <Button key={f} size="sm" variant={orderFilter === f ? "default" : "outline"} onClick={() => setOrderFilter(f)}>
                    {f === "all" ? "الكل" : statusMap[f].label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث باسم العميل أو رقم الموبايل..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="pr-10" />
            </div>

            {filteredOrders.length === 0 ? (
              <Card><CardContent className="p-12 text-center"><ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">مفيش طلبات</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const s = statusMap[order.status] || statusMap.new;
                  return (
                    <Card key={order.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setShowOrderDetail(order)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">#{order.order_number || '—'}</Badge>
                              <span className="font-semibold">{order.customer_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">📱 {order.customer_phone}</p>
                            <p className="text-sm font-semibold text-primary">الإجمالي: {order.total_price} جنيه</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("ar-EG")}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <div className="flex flex-wrap gap-1">
                              {["new", "processing", "delivered", "cancelled"].map(st => (
                                <Button key={st} size="sm" variant={order.status === st ? "default" : "outline"} className="text-xs"
                                  onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, st); }}>
                                  {statusMap[st].label}
                                </Button>
                              ))}
                            </div>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async (e) => {
                              e.stopPropagation();
                              await supabase.from("order_items").delete().eq("order_id", order.id);
                              await supabase.from("orders").delete().eq("id", order.id);
                              toast({ title: "تم حذف الطلب" });
                              fetchData();
                            }}>
                              <Trash2 className="h-3 w-3 ml-1" />حذف
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Order Detail Dialog */}
          <Dialog open={!!showOrderDetail} onOpenChange={(o) => !o && setShowOrderDetail(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>تفاصيل الطلب #{showOrderDetail?.order_number || '—'}</DialogTitle></DialogHeader>
              {showOrderDetail && (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                    <p><strong>العميل:</strong> {showOrderDetail.customer_name}</p>
                    <p><strong>الموبايل:</strong> {showOrderDetail.customer_phone}</p>
                    <p><strong>العنوان:</strong> {showOrderDetail.customer_address}</p>
                    {showOrderDetail.customer_notes && <p><strong>ملاحظات:</strong> {showOrderDetail.customer_notes}</p>}
                    <p><strong>التاريخ:</strong> {new Date(showOrderDetail.created_at).toLocaleString("ar-EG")}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">المنتجات:</h4>
                    {showOrderDetail.order_items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm border-b pb-1">
                        <div>
                          <p>{item.products?.name || "منتج"} × {item.quantity}</p>
                          {item.selected_size && <p className="text-xs text-muted-foreground">المقاس: {item.selected_size}</p>}
                          {item.selected_color && <p className="text-xs text-muted-foreground">اللون: {item.selected_color}</p>}
                        </div>
                        <span className="font-semibold">{item.price * item.quantity} جنيه</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 text-sm space-y-1">
                    {showOrderDetail.shipping_cost > 0 && (
                      <div className="flex justify-between"><span>التوصيل</span><span>{showOrderDetail.shipping_cost} جنيه</span></div>
                    )}
                    <div className="flex justify-between font-bold text-base">
                      <span>الإجمالي</span><span className="text-primary">{showOrderDetail.total_price} جنيه</span>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <h2 className="text-lg font-semibold">التصنيفات</h2>
            <div className="flex gap-2">
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="اسم التصنيف الجديد" />
              <Button onClick={addCategory}><Plus className="h-4 w-4 ml-1" />ضيف</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
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
                <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" />رصيد النقاط: {store.points_balance} نقطة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">كل طلب بيخصم نقطة واحدة. لو رصيدك خلص مش هتقدر تستقبل طلبات.</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                  {[100, 200, 300, 500, 1000].map(p => (
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
                <a href={whatsappUrl} target="_blank"><Button className="w-full">شحن نقاط عبر الواتساب</Button></a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>سجل العمليات</CardTitle></CardHeader>
              <CardContent>
                {transactions.length === 0 ? <p className="text-muted-foreground text-sm">مفيش عمليات لسه</p> : (
                  <div className="space-y-2">
                    {transactions.map(t => (
                      <div key={t.id} className="flex justify-between items-center text-sm border-b border-border pb-2">
                        <div><p>{t.description}</p><p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ar-EG")}</p></div>
                        <span className={`font-bold ${t.amount > 0 ? "text-green-600" : "text-red-500"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />إعدادات التسويق</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">ضيف أكواد البيكسل عشان تتبع حملاتك الإعلانية وتحسن مبيعاتك</p>
                <div className="space-y-2">
                  <Label>Facebook Pixel ID</Label>
                  <Input value={editFacebookPixel} onChange={(e) => setEditFacebookPixel(e.target.value)} placeholder="مثال: 123456789012345" dir="ltr" />
                  <p className="text-xs text-muted-foreground">هتلاقيه في Facebook Events Manager</p>
                </div>
                <div className="space-y-2">
                  <Label>TikTok Pixel ID</Label>
                  <Input value={editTiktokPixel} onChange={(e) => setEditTiktokPixel(e.target.value)} placeholder="مثال: CXXXXXXXXXXXXXXXXX" dir="ltr" />
                  <p className="text-xs text-muted-foreground">هتلاقيه في TikTok Ads Manager → Assets → Events</p>
                </div>
                <div className="space-y-2">
                  <Label>Google Analytics ID</Label>
                  <Input value={editGoogleAnalytics} onChange={(e) => setEditGoogleAnalytics(e.target.value)} placeholder="مثال: G-XXXXXXXXXX" dir="ltr" />
                  <p className="text-xs text-muted-foreground">هتلاقيه في Google Analytics → Admin → Data Streams</p>
                </div>
                <div className="space-y-2">
                  <Label>Snapchat Pixel ID</Label>
                  <Input value={editSnapchatPixel} onChange={(e) => setEditSnapchatPixel(e.target.value)} placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx" dir="ltr" />
                  <p className="text-xs text-muted-foreground">هتلاقيه في Snapchat Ads Manager → Events Manager</p>
                </div>
                <Button onClick={saveStoreSettings} disabled={savingSettings} className="w-full">
                  {savingSettings ? "جاري الحفظ..." : "حفظ إعدادات التسويق"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />الإشعارات</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">مفيش إشعارات لسه</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className={`border rounded-lg p-3 ${n.is_read ? "border-border" : "border-primary/40 bg-primary/5"}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm">{n.title}</h4>
                            <p className="text-sm text-muted-foreground">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("ar-EG")}</p>
                          </div>
                          <div className="flex gap-1">
                            {!n.is_read && (
                              <Button size="sm" variant="ghost" onClick={async () => {
                                await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                                fetchData();
                              }}>
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => {
                              await supabase.from("notifications").delete().eq("id", n.id);
                              toast({ title: "تم حذف الإشعار" });
                              fetchData();
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>كوبونات الخصم</CardTitle>
                  <CouponForm storeId={store.id} onSaved={fetchData} />
                </div>
              </CardHeader>
              <CardContent>
                {coupons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">مفيش كوبونات لسه</p>
                ) : (
                  <div className="space-y-3">
                    {coupons.map(c => (
                      <div key={c.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg">{c.code}</span>
                            <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "فعّال" : "متوقف"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            خصم {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} جنيه`}
                            {c.min_order_amount > 0 && ` — حد أدنى ${c.min_order_amount} جنيه`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            استخدام: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                            {c.expires_at && ` — ينتهي: ${new Date(c.expires_at).toLocaleDateString("ar-EG")}`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={async () => {
                            await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
                            fetchData();
                          }}>
                            {c.is_active ? "إيقاف" : "تفعيل"}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            await supabase.from("coupons").delete().eq("id", c.id);
                            fetchData();
                          }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Shipping / Governorates Tab */}
          <TabsContent value="shipping" className="space-y-4">
            <ShippingManager storeId={store.id} storeShipping={storeShipping} onSaved={fetchData} defaultCost={store.shipping_cost || 70} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>إعدادات المتجر</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>اسم المتجر</Label><Input value={editStoreName} onChange={(e) => setEditStoreName(e.target.value)} /></div>
                <div className="space-y-2"><Label>رقم الواتساب</Label><Input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} dir="ltr" /></div>
                <div className="space-y-2"><Label>سعر التوصيل (جنيه)</Label><Input type="number" value={editShippingCost} onChange={(e) => setEditShippingCost(e.target.value)} dir="ltr" /></div>
                <div className="space-y-2">
                  <Label>القالب</Label>
                  <Select value={editTheme} onValueChange={setEditTheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{templates.map(t => <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>اللون الأساسي</Label><Input type="color" value={editPrimaryColor} onChange={(e) => setEditPrimaryColor(e.target.value)} className="h-10" /></div>
                  <div className="space-y-2"><Label>اللون الثانوي</Label><Input type="color" value={editSecondaryColor} onChange={(e) => setEditSecondaryColor(e.target.value)} className="h-10" /></div>
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

function CouponForm({ storeId, onSaved }: { storeId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    if (!code || !discountValue) return;
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      store_id: storeId,
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: minOrder ? Number(minOrder) : 0,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt || null,
    });
    if (error) {
      toast({ title: error.code === "23505" ? "الكود موجود قبل كده" : "حصل مشكلة", variant: "destructive" });
    } else {
      toast({ title: "تم إضافة الكوبون ✅" });
      setOpen(false);
      setCode(""); setDiscountValue(""); setMinOrder(""); setMaxUses(""); setExpiresAt("");
      onSaved();
    }
    setSaving(false);
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 ml-1" />إضافة كوبون</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة كوبون خصم</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>كود الكوبون</Label>
              <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="مثلاً: SAVE20" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>نوع الخصم</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية %</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت (جنيه)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>قيمة الخصم {discountType === 'percentage' ? '(%)' : '(جنيه)'}</Label>
              <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الحد الأدنى للطلب (اختياري)</Label>
              <Input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="0" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>أقصى عدد استخدامات (اختياري)</Label>
              <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="بدون حد" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} dir="ltr" />
            </div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "جاري الحفظ..." : "إضافة الكوبون"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const EGYPTIAN_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة",
  "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية",
  "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد",
  "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
  "قنا", "شمال سيناء", "سوهاج"
];

function ShippingManager({ storeId, storeShipping, onSaved, defaultCost }: {
  storeId: string; storeShipping: any[]; onSaved: () => void; defaultCost: number;
}) {
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initial: Record<string, string> = {};
    EGYPTIAN_GOVERNORATES.forEach(gov => {
      const existing = storeShipping.find(s => s.governorate === gov);
      initial[gov] = existing ? String(existing.shipping_cost) : String(defaultCost);
    });
    setCosts(initial);
  }, [storeShipping, defaultCost]);

  const setAllSamePrice = (price: string) => {
    const updated: Record<string, string> = {};
    EGYPTIAN_GOVERNORATES.forEach(gov => { updated[gov] = price; });
    setCosts(updated);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Delete all existing
      await supabase.from("store_shipping").delete().eq("store_id", storeId);
      
      // Insert all
      const rows = EGYPTIAN_GOVERNORATES.map(gov => ({
        store_id: storeId,
        governorate: gov,
        shipping_cost: parseFloat(costs[gov]) || defaultCost,
        is_active: true,
      }));
      const { error } = await supabase.from("store_shipping").insert(rows);
      if (error) throw error;
      
      toast({ title: "تمام يسطا! أسعار التوصيل اتحفظت 🎉" });
      onSaved();
    } catch (e: any) {
      toast({ title: "حصلت مشكلة 😕", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">📍 أسعار التوصيل حسب المحافظة</CardTitle>
        <p className="text-sm text-muted-foreground">حدد سعر التوصيل لكل محافظة يسطا — العميل هيختار محافظته وهيشوف السعر تلقائي</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
          <Label className="whitespace-nowrap text-sm">سعر موحد لكل المحافظات:</Label>
          <Input type="number" placeholder="70" dir="ltr" className="w-24"
            onChange={(e) => setAllSamePrice(e.target.value)} />
          <span className="text-xs text-muted-foreground">جنيه</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {EGYPTIAN_GOVERNORATES.map(gov => (
            <div key={gov} className="flex items-center gap-2 border border-border rounded-lg p-2">
              <span className="text-sm font-medium flex-1 truncate">{gov}</span>
              <Input
                type="number"
                value={costs[gov] || ""}
                onChange={(e) => setCosts(prev => ({ ...prev, [gov]: e.target.value }))}
                className="w-20 text-center"
                dir="ltr"
              />
              <span className="text-xs text-muted-foreground">ج</span>
            </div>
          ))}
        </div>

        <Button className="w-full h-11" onClick={saveAll} disabled={saving}>
          {saving ? "ثانية يسطا... ⏳" : "احفظ أسعار التوصيل 💾"}
        </Button>
      </CardContent>
    </Card>
  );
}
