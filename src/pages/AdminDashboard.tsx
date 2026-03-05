import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, ShoppingCart, Coins, TrendingUp, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">لوحة تحكم الأدمن</h1>
          <p className="text-muted-foreground">إدارة كاملة للمنصة</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Store, label: "المتاجر", value: "0" },
            { icon: Users, label: "المستخدمين", value: "0" },
            { icon: ShoppingCart, label: "الطلبات", value: "0" },
            { icon: Coins, label: "إجمالي المبيعات", value: "0 ج.م" },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المتاجر</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">قريبًا - إدارة كاملة لكل المتاجر</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>إدارة النقاط</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">قريبًا - إضافة وخصم نقاط للتجار</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
