import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, Users, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface VisitorAnalyticsProps {
  storeId?: string; // undefined = all stores (admin)
  title?: string;
}

const FILTERS = [
  { label: "يومين", days: 2 },
  { label: "7 أيام", days: 7 },
  { label: "90 يوم", days: 90 },
  { label: "12 شهر", days: 365 },
];

export default function VisitorAnalytics({ storeId, title = "إحصائيات الزوار" }: VisitorAnalyticsProps) {
  const [filter, setFilter] = useState(7);
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<{ page: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [filter, storeId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - filter);

    let query = supabase
      .from("page_views")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data } = await query;
    const views = data || [];

    setTotalViews(views.length);
    const uniqueIds = new Set(views.map((v) => v.visitor_id).filter(Boolean));
    setUniqueVisitors(uniqueIds.size);

    // Chart data - group by day or month
    const grouped: Record<string, number> = {};
    views.forEach((v) => {
      const date = new Date(v.created_at);
      const key = filter > 90
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    setChartData(Object.entries(grouped).map(([date, count]) => ({ date, زيارات: count })));

    // Top pages
    const pageCounts: Record<string, number> = {};
    views.forEach((v) => {
      pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
    });
    const sorted = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));
    setTopPages(sorted);

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <Button
                key={f.days}
                size="sm"
                variant={filter === f.days ? "default" : "outline"}
                onClick={() => setFilter(f.days)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-xl p-4 text-center">
                <Globe className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{totalViews.toLocaleString("ar-EG")}</p>
                <p className="text-xs text-muted-foreground">إجمالي الزيارات</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{uniqueVisitors.toLocaleString("ar-EG")}</p>
                <p className="text-xs text-muted-foreground">زوار فريدين</p>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="زيارات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">مفيش زيارات في الفترة دي</p>
            )}

            {/* Top Pages */}
            {topPages.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> أكثر الصفحات زيارة
                </h4>
                <div className="space-y-2">
                  {topPages.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <span className="truncate max-w-[70%]" dir="ltr">{p.page}</span>
                      <span className="font-bold text-primary">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
