import { useState } from "react";
import { Package, ShoppingCart, Users, TrendingUp, PoundSterling } from "lucide-react";
import { useOrders } from "@/hooks/useAdminData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const KPICard = ({ title, value, icon: Icon, subtitle, accent }: { title: string; value: string; icon: any; subtitle?: string; accent?: boolean }) => (
  <div className={`bg-card border rounded-xl p-5 ${accent ? "border-primary/40 bg-primary/5" : "border-border"}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground">{title}</span>
      <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
    </div>
    <p className="font-serif text-2xl font-black text-foreground">{value}</p>
    {subtitle && <p className="font-serif text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

const statusColor: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-800",
  confirmed:        "bg-green-100 text-green-800",
  "in-production":  "bg-orange-100 text-orange-800",
  shipped:          "bg-purple-100 text-purple-800",
  delivered:        "bg-blue-100 text-blue-800",
  cancelled:        "bg-red-100 text-red-800",
};

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

function buildRevenueData(orders: any[], region: "PK" | "UK") {
  // Only count confirmed orders (not pending or cancelled)
  const filtered = orders.filter(
    (o) => o.region === region && o.status !== "pending" && o.status !== "cancelled"
  );
  const map: Record<string, number> = {};
  filtered.forEach((o) => {
    const key = getMonthKey(o.created_at);
    map[key] = (map[key] || 0) + Number(o.total);
  });
  // Last 6 months in order
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
  }
  return months.map((m) => ({ month: m, revenue: map[m] || 0 }));
}

export default function AdminOverview() {
  const [activeRegion, setActiveRegion] = useState<"PK" | "UK">("PK");
  const { data: orders = [], isLoading } = useOrders();

  // Products count
  const { data: productsData } = useQuery({
    queryKey: ["products-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl font-black text-foreground">Dashboard Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const pkOrders = orders.filter((o: any) => o.region === "PK");
  const ukOrders = orders.filter((o: any) => o.region === "UK");
  const regionOrders = activeRegion === "PK" ? pkOrders : ukOrders;

  // KPIs for selected region
  const confirmedOrders = regionOrders.filter((o: any) => o.status !== "pending" && o.status !== "cancelled");
  const totalRevenue = confirmedOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const totalOrderCount = regionOrders.length;
  const avgOrder = confirmedOrders.length > 0 ? Math.round(totalRevenue / confirmedOrders.length) : 0;

  // Unique customers in this region (by email)
  const uniqueEmails = new Set(confirmedOrders.map((o: any) => o.email));
  const customerCount = uniqueEmails.size;

  // Revenue chart
  const revenueData = buildRevenueData(orders, activeRegion);

  // Recent orders (last 5, all statuses, selected region)
  const recentOrders = [...regionOrders]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  regionOrders.forEach((o: any) => {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
  });

  const isPK = activeRegion === "PK";
  const currencySymbol = isPK ? "PKR" : "£";
  const formatAmt = (n: number) => isPK ? `PKR ${n.toLocaleString()}` : `£${n.toLocaleString("en-GB")}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-black text-foreground">Dashboard Overview</h1>

        {/* Region toggle */}
        <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-1">
          {(["PK", "UK"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRegion(r)}
              className="font-serif text-xs font-bold px-4 py-2 rounded-lg transition-all"
              style={{
                background: activeRegion === r ? "hsl(var(--primary))" : "transparent",
                color: activeRegion === r ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              {r === "PK" ? "🇵🇰 Pakistan" : "🇬🇧 UK"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatAmt(totalRevenue)}
          icon={isPK ? TrendingUp : PoundSterling}
          subtitle="Confirmed orders only"
          accent
        />
        <KPICard
          title="Total Orders"
          value={totalOrderCount.toString()}
          icon={ShoppingCart}
          subtitle={confirmedOrders.length > 0 ? `Avg ${formatAmt(avgOrder)}` : "No confirmed orders yet"}
        />
        <KPICard
          title="Customers"
          value={customerCount.toString()}
          icon={Users}
          subtitle="Unique confirmed buyers"
        />
        <KPICard
          title="Products"
          value={(productsData || 0).toString()}
          icon={Package}
          subtitle="In catalogue"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {["pending", "confirmed", "in-production", "shipped", "delivered", "cancelled"].map((s) => (
          <div key={s} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="font-serif text-xl font-black text-foreground">{statusBreakdown[s] || 0}</p>
            <span className={`font-serif text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[s]}`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-serif font-black text-foreground mb-4">
          Revenue — Last 6 Months ({activeRegion === "PK" ? "PKR" : "GBP"})
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(24 30% 88%)" />
              <XAxis dataKey="month" tick={{ fontFamily: "Georgia", fontSize: 12 }} />
              <YAxis
                tick={{ fontFamily: "Georgia", fontSize: 12 }}
                tickFormatter={(v) => isPK ? `${(v / 1000).toFixed(0)}k` : `£${v}`}
              />
              <Tooltip
                formatter={(value: number) => [formatAmt(value), "Revenue"]}
                contentStyle={{ fontFamily: "Georgia", borderRadius: "0.75rem", border: "1px solid hsl(24 30% 88%)" }}
              />
              <Bar dataKey="revenue" fill="hsl(0 70% 34%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {revenueData.every((d) => d.revenue === 0) && (
          <p className="font-serif text-sm text-muted-foreground text-center mt-2">No confirmed orders in the last 6 months for this region.</p>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-serif font-black text-foreground mb-4">
          Recent Orders — {activeRegion === "PK" ? "🇵🇰 Pakistan" : "🇬🇧 UK"}
        </h2>
        {recentOrders.length === 0 ? (
          <p className="font-serif text-sm text-muted-foreground py-4 text-center">No orders yet for this region.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-serif text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Order ID</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Customer</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">City</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Total</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 font-bold text-foreground text-xs">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 text-foreground">{order.first_name} {order.last_name}</td>
                    <td className="py-3 text-muted-foreground">{order.city}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 text-foreground font-bold">{formatAmt(Number(order.total))}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${statusColor[order.status] || "bg-gray-100 text-gray-800"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}