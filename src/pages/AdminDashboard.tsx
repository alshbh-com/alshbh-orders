import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Users, ShoppingCart, Coins, TrendingUp, Trash2, Ban, CheckCircle,
  Plus, Minus, Eye, Mail, Bell, MessageSquare, BarChart3
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Point management
  const [showPointDialog, setShowPointDialog] = useState(false);
  const [pointStoreId, setPointStoreId] = useState("");
  const [pointAmount, setPointAmount] = useState("");
  const [pointType, setPointType] = useState("add");
  const [pointDesc, setPointDesc] = useState("");

  // Notification
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyUserId, setNotifyUserId] = useState("");
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");

  // Order filter
  const [orderFilter, setOrderFilter] = useState("all");

  const { user } = useAuth();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [storesRes, profilesRes, rolesRes, ordersRes, complaintsRes, transRes] = await Promise.all([
      supabase.from("stores").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("orders").select("*, stores(store_name)").order("created_at", { ascending: false }),
      supabase.from("complaints").select("*").order("created_at", { ascending: false }),
      supabase.from("point_transactions").select("*, stores(store_name)").order("created_at", { ascending: false }).limit(50),
    ]);
    setStores(storesRes.data || []);
    setUsers(profilesRes.data || []);
    setRoles(rolesRes.data || []);
    setOrders(ordersRes.data || []);
    setComplaints(complaintsRes.data || []);
    setTransactions(transRes.data || []);
    setLoading(false);
  };

  const toggleStore = async (storeId: string, isActive: boolean) => {
    await supabase.from("stores").update({ is_active: !isActive }).eq("id", storeId);
    toast({ title: isActive ? "تم إيقاف المتجر" : "تم تفعيل المتجر" });
    fetchAll();
  };

  const deleteStore = async (storeId: string) => {
    await supabase.from("stores").delete().eq("id", storeId);
    toast({ title: "تم حذف المتجر" });
    fetchAll();
  };

  const getUserRole = (userId: string) => roles.find(r => r.user_id === userId)?.role || "—";

  const changeUserRole = async (userId: string, role: string) => {
    const existing = roles.find(r => r.user_id === userId);
    if (role === "none") {
      if (existing) await supabase.from("user_roles").delete().eq("id", existing.id);
    } else if (existing) {
      await supabase.from("user_roles").update({ role: role as "admin" | "merchant" }).eq("id", existing.id);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: role as "admin" | "merchant" });
    }
    toast({ title: "تم تحديث الدور" });
    fetchAll();
  };

  const deleteUser = async (userId: string) => {
    // Only delete profile and roles, can't delete auth user from client
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    toast({ title: "تم حذف بيانات المستخدم" });
    fetchAll();
  };

  const managePoints = async () => {
    if (!pointStoreId || !pointAmount) return;
    const amount = pointType === "add" ? parseInt(pointAmount) : -parseInt(pointAmount);
    
    // Update balance
    const store = stores.find(s => s.id === pointStoreId);
    if (!store) return;
    const newBalance = Math.max(0, store.points_balance + amount);
    await supabase.from("stores").update({ points_balance: newBalance }).eq("id", pointStoreId);
    
    // Log transaction
    await supabase.from("point_transactions").insert({
      store_id: pointStoreId,
      amount,
      type: pointType === "add" ? "add" : "deduct",
      description: pointDesc || (pointType === "add" ? "إضافة نقاط بواسطة الأدمن" : "خصم نقاط بواسطة الأدمن"),
      created_by: user?.id,
    });

    toast({ title: "تم تحديث النقاط" });
    setShowPointDialog(false);
    setPointAmount("");
    setPointDesc("");
    fetchAll();
  };

  const sendNotification = async () => {
    if (!notifyUserId || !notifyTitle || !notifyMessage) return;
    if (notifyUserId === "all") {
      // Send to all store owners
      const ownerIds = [...new Set(stores.map(s => s.owner_id))];
      await Promise.all(ownerIds.map(id =>
        supabase.from("notifications").insert({ user_id: id, title: notifyTitle, message: notifyMessage })
      ));
    } else {
      await supabase.from("notifications").insert({ user_id: notifyUserId, title: notifyTitle, message: notifyMessage });
    }
    toast({ title: "تم إرسال الإشعار" });
    setShowNotifyDialog(false);
    setNotifyTitle("");
    setNotifyMessage("");
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    await supabase.from("complaints").update({ status }).eq("id", id);
    fetchAll();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status: status as "new" | "processing" | "delivered" | "cancelled" }).eq("id", orderId);
    fetchAll();
  };

  const filteredOrders = orderFilter === "all" ? orders : orders.filter(o => o.status === orderFilter);

  const totalSales = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0);

  const statusMap: Record<string, string> = {
    new: "جديد", processing: "قيد التجهيز", delivered: "تم التوصيل", cancelled: "ملغي"
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

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">لوحة تحكم الأدمن</h1>
          <p className="text-muted-foreground">إدارة كاملة للمنصة</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Store, label: "المتاجر", value: stores.length },
            { icon: Users, label: "المستخدمين", value: users.length },
            { icon: ShoppingCart, label: "الطلبات", value: orders.length },
            { icon: Coins, label: "إجمالي المبيعات", value: `${totalSales} ج.م` },
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

        <Tabs defaultValue="stores" className="space-y-4">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="stores">المتاجر</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="points">النقاط</TabsTrigger>
            <TabsTrigger value="complaints">الشكاوى</TabsTrigger>
            <TabsTrigger value="referrals">الإحالات 🎁</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          </TabsList>

          {/* Stores Tab */}
          <TabsContent value="stores">
            <Card>
              <CardHeader><CardTitle>إدارة المتاجر ({stores.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المتجر</TableHead>
                        <TableHead>الرابط</TableHead>
                        <TableHead>النقاط</TableHead>
                        <TableHead>الإحالة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold">{s.store_name}</TableCell>
                          <TableCell className="text-xs" dir="ltr">/store/{s.store_slug}</TableCell>
                          <TableCell>
                            <Badge variant={s.points_balance > 0 ? "default" : "destructive"}>
                              {s.points_balance}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.is_active ? "default" : "secondary"}>
                              {s.is_active ? "مفعل" : "متوقف"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => toggleStore(s.id, s.is_active)}>
                                {s.is_active ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setPointStoreId(s.id); setShowPointDialog(true); }}>
                                <Coins className="h-3 w-3" />
                              </Button>
                              <a href={`/store/${s.store_slug}`} target="_blank">
                                <Button size="sm" variant="outline"><Eye className="h-3 w-3" /></Button>
                              </a>
                              <Button size="sm" variant="destructive" onClick={() => deleteStore(s.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>إدارة المستخدمين ({users.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>تاريخ التسجيل</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-semibold">{u.full_name || "—"}</TableCell>
                          <TableCell>
                            <Select value={getUserRole(u.id)} onValueChange={(v) => changeUserRole(u.id, v)}>
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">أدمن</SelectItem>
                                <SelectItem value="merchant">تاجر</SelectItem>
                                <SelectItem value="none">بدون</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString("ar-EG")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => { setNotifyUserId(u.id); setShowNotifyDialog(true); }}>
                                <Bell className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <CardTitle>الطلبات ({filteredOrders.length})</CardTitle>
                  <div className="flex gap-1 flex-wrap">
                    {["all", "new", "processing", "delivered", "cancelled"].map(f => (
                      <Button key={f} size="sm" variant={orderFilter === f ? "default" : "outline"} onClick={() => setOrderFilter(f)}>
                        {f === "all" ? "الكل" : statusMap[f]}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>العميل</TableHead>
                        <TableHead>المتجر</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>تغيير</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-sm">{o.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{(o as any).stores?.store_name || "—"}</TableCell>
                          <TableCell className="font-semibold">{o.total_price} ج.م</TableCell>
                          <TableCell>
                            <Badge variant={o.status === "delivered" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"}>
                              {statusMap[o.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString("ar-EG")}</TableCell>
                          <TableCell>
                            <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusMap).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="points">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>إدارة النقاط</CardTitle>
                  <Button onClick={() => { setPointStoreId(""); setShowPointDialog(true); }}>
                    <Plus className="h-4 w-4 ml-1" />إضافة/خصم نقاط
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-3">أرصدة المتاجر</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {stores.map(s => (
                    <Card key={s.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setPointStoreId(s.id); setShowPointDialog(true); }}>
                      <CardContent className="p-3 text-center">
                        <p className="font-semibold text-sm truncate">{s.store_name}</p>
                        <p className={`text-2xl font-bold ${s.points_balance > 0 ? "text-green-600" : "text-destructive"}`}>{s.points_balance}</p>
                        <p className="text-xs text-muted-foreground">نقطة</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <h3 className="font-semibold mb-3">سجل العمليات</h3>
                <div className="space-y-2">
                  {transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm border-b border-border pb-2">
                      <div>
                        <p className="font-semibold">{(t as any).stores?.store_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ar-EG")}</p>
                      </div>
                      <span className={`font-bold text-lg ${t.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                        {t.amount > 0 ? "+" : ""}{t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints">
            <Card>
              <CardHeader><CardTitle>الشكاوى والرسائل ({complaints.length})</CardTitle></CardHeader>
              <CardContent>
                {complaints.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">مفيش شكاوى</p>
                ) : (
                  <div className="space-y-3">
                    {complaints.map(c => (
                      <Card key={c.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{c.name}</p>
                              {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                              {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                              <p className="text-sm mt-2">{c.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString("ar-EG")}</p>
                            </div>
                            <Select value={c.status} onValueChange={(v) => updateComplaintStatus(c.id, v)}>
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">معلق</SelectItem>
                                <SelectItem value="resolved">تم الحل</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>إرسال إشعارات</CardTitle>
                  <Button onClick={() => { setNotifyUserId(""); setShowNotifyDialog(true); }}>
                    <Bell className="h-4 w-4 ml-1" />إرسال إشعار
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">اختار مستخدم من تبويب المستخدمين أو اضغط "إرسال إشعار" لإرسال إشعار لكل التجار</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Points Dialog */}
        <Dialog open={showPointDialog} onOpenChange={setShowPointDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إدارة النقاط</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>المتجر</Label>
                <Select value={pointStoreId} onValueChange={setPointStoreId}>
                  <SelectTrigger><SelectValue placeholder="اختار متجر" /></SelectTrigger>
                  <SelectContent>
                    {stores.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.store_name} ({s.points_balance} نقطة)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العملية</Label>
                <Select value={pointType} onValueChange={setPointType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">إضافة نقاط</SelectItem>
                    <SelectItem value="deduct">خصم نقاط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>عدد النقاط</Label>
                <Input type="number" value={pointAmount} onChange={(e) => setPointAmount(e.target.value)} placeholder="100" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>ملاحظة (اختياري)</Label>
                <Input value={pointDesc} onChange={(e) => setPointDesc(e.target.value)} placeholder="سبب العملية" />
              </div>
              <Button className="w-full" onClick={managePoints}>تنفيذ</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Dialog */}
        <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إرسال إشعار</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>المستلم</Label>
                <Select value={notifyUserId} onValueChange={setNotifyUserId}>
                  <SelectTrigger><SelectValue placeholder="اختار" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل التجار</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder="عنوان الإشعار" />
              </div>
              <div className="space-y-2">
                <Label>الرسالة</Label>
                <Textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="نص الإشعار" />
              </div>
              <Button className="w-full" onClick={sendNotification}>إرسال</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
