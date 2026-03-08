import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Clock, Truck, XCircle, CheckCircle } from "lucide-react";
import AlshbhWatermark from "@/components/AlshbhWatermark";

const statusMap: Record<string, { label: string; icon: any; color: string; step: number }> = {
  new: { label: "تم استلام الطلب", icon: Clock, color: "text-blue-600", step: 1 },
  processing: { label: "قيد التجهيز", icon: Package, color: "text-yellow-600", step: 2 },
  delivered: { label: "تم التوصيل", icon: CheckCircle, color: "text-green-600", step: 3 },
  cancelled: { label: "ملغي", icon: XCircle, color: "text-red-600", step: 0 },
};

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);

    // Search by order_number or phone
    const isNumber = /^\d+$/.test(query.trim());
    let result: any = null;

    if (isNumber && query.trim().length <= 6) {
      const { data } = await supabase.from("orders")
        .select("*, stores(store_name, primary_color), order_items(*, products(name, main_image_url))")
        .eq("order_number", parseInt(query.trim()))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      result = data;
    }

    if (!result) {
      const { data } = await supabase.from("orders")
        .select("*, stores(store_name, primary_color), order_items(*, products(name, main_image_url))")
        .eq("customer_phone", query.trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      result = data;
    }

    if (result) {
      setOrder(result);
      setItems(result.order_items || []);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const s = order ? statusMap[order.status] || statusMap.new : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      <div className="container max-w-lg py-12 flex-1">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">تتبع طلبك 📦</h1>
          <p className="text-muted-foreground mt-1">اكتب رقم الطلب أو رقم موبايلك</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="رقم الطلب أو رقم الموبايل..."
            className="rounded-xl"
            dir="ltr"
            onKeyDown={e => e.key === "Enter" && search()}
          />
          <Button onClick={search} disabled={loading} className="rounded-xl shrink-0">
            {loading ? "..." : <><Search className="h-4 w-4 ml-1" />بحث</>}
          </Button>
        </div>

        {notFound && (
          <Card className="text-center">
            <CardContent className="py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">ملقيناش الطلب ده يسطا 😕</p>
              <p className="text-sm text-muted-foreground mt-1">تأكد من الرقم وجرب تاني</p>
            </CardContent>
          </Card>
        )}

        {order && s && (
          <Card className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: (order.stores as any)?.primary_color || 'hsl(var(--primary))' }} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">طلب #{order.order_number || '—'}</CardTitle>
                <Badge className={`${s.color} bg-transparent border`}>{s.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {(order.stores as any)?.store_name} — {new Date(order.created_at).toLocaleDateString("ar-EG")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Steps */}
              {order.status !== "cancelled" && (
                <div className="flex items-center justify-between px-4">
                  {[1, 2, 3].map(step => {
                    const active = s.step >= step;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {step === 1 && <Clock className="h-5 w-5" />}
                          {step === 2 && <Package className="h-5 w-5" />}
                          {step === 3 && <CheckCircle className="h-5 w-5" />}
                        </div>
                        <span className={`text-xs ${active ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {step === 1 ? "تم الاستلام" : step === 2 ? "جاري التجهيز" : "تم التوصيل"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="bg-destructive/10 rounded-xl p-4 text-center">
                  <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-semibold text-destructive">الطلب ده اتلغى</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">المنتجات:</h4>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                    {(item.products as any)?.main_image_url ? (
                      <img src={(item.products as any).main_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{(item.products as any)?.name || "منتج"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {item.price} جنيه
                        {item.selected_size && ` — ${item.selected_size}`}
                        {item.selected_color && ` — ${item.selected_color}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">التوصيل</span><span>{order.shipping_cost} جنيه</span></div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600"><span>الخصم</span><span>-{order.discount_amount} جنيه</span></div>
                )}
                <div className="flex justify-between font-bold border-t border-border pt-1">
                  <span>الإجمالي</span>
                  <span style={{ color: (order.stores as any)?.primary_color || 'hsl(var(--primary))' }}>{order.total_price} جنيه</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AlshbhWatermark />
    </div>
  );
}
