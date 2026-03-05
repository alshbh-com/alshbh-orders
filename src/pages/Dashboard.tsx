import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Coins, Store, Settings, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">أهلاً بيك! من هنا تقدر تدير متجرك</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Store, label: "متجرك", value: "—", color: "text-primary" },
            { icon: Package, label: "المنتجات", value: "0", color: "text-blue-500" },
            { icon: ShoppingCart, label: "الطلبات", value: "0", color: "text-green-500" },
            { icon: Coins, label: "رصيد النقاط", value: "0", color: "text-yellow-500" },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">ضيف منتج</h3>
              <p className="text-sm text-muted-foreground">ضيف منتج جديد لمتجرك</p>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <ShoppingCart className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">الطلبات الجديدة</h3>
              <p className="text-sm text-muted-foreground">شوف الطلبات اللي وصلتك</p>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">إعدادات المتجر</h3>
              <p className="text-sm text-muted-foreground">عدّل بيانات متجرك والقالب</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                شحن النقاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">كل طلب بيخصم نقطة واحدة. اشحن نقاطك عشان تفضل تستقبل طلبات.</p>
              <a
                href={"https://wa.me/201061067966?text=" + encodeURIComponent("أريد شحن نقاط لمنصة ALSHBH")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>شحن نقاط عبر الواتساب</Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
