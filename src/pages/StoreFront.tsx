import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AlshbhWatermark from "@/components/AlshbhWatermark";
import { Store, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreFront() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("store_slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (storeData) {
        setStore(storeData);
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("is_active", true);
        setProducts(productsData || []);
      }
      setLoading(false);
    };
    fetchStore();
  }, [slug]);

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Store Header */}
      <header className="border-b border-border bg-background py-6">
        <div className="container flex items-center gap-4">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.store_name} className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-7 w-7 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{store.store_name}</h1>
            <p className="text-sm text-muted-foreground">مرحبًا بيك في متجرنا</p>
          </div>
        </div>
      </header>

      {/* Products */}
      <main className="flex-1 container py-8">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">مفيش منتجات لسه</h2>
            <p className="text-muted-foreground">التاجر لسه مضافش منتجات</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                {product.main_image_url ? (
                  <img src={product.main_image_url} alt={product.name} className="w-full h-48 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  {product.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{product.price} جنيه</span>
                    <Button size="sm">أضف للسلة</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AlshbhWatermark />
    </div>
  );
}
