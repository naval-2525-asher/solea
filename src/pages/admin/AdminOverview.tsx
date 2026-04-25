import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { mockOrders, mockCustomers, revenueData } from "@/lib/mockAdminData";
import { products } from "@/lib/products";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const KPICard = ({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: any; subtitle?: string }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground">{title}</span>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="font-serif text-2xl font-black text-foreground">{value}</p>
    {subtitle && <p className="font-serif text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

export default function AdminOverview() {
  const totalRevenue = mockOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = mockOrders.length;
  const totalCustomers = mockCustomers.length;
  const avgOrderValue = Math.round(totalRevenue / totalOrders);

  const recentOrders = [...mockOrders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    "in-production": "bg-accent/30 text-foreground",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-black text-foreground">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={`PKR ${totalRevenue.toLocaleString()}`} icon={TrendingUp} subtitle="All time" />
        <KPICard title="Total Orders" value={totalOrders.toString()} icon={ShoppingCart} subtitle={`Avg PKR ${avgOrderValue.toLocaleString()}`} />
        <KPICard title="Customers" value={totalCustomers.toString()} icon={Users} />
        <KPICard title="Products" value={products.length.toString()} icon={Package} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-serif font-black text-foreground mb-4">Revenue (Last 6 Months)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(24 30% 88%)" />
              <XAxis dataKey="month" tick={{ fontFamily: "Georgia", fontSize: 12 }} />
              <YAxis tick={{ fontFamily: "Georgia", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Revenue"]}
                contentStyle={{ fontFamily: "Georgia", borderRadius: "0.75rem", border: "1px solid hsl(24 30% 88%)" }}
              />
              <Bar dataKey="revenue" fill="hsl(0 70% 34%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-serif font-black text-foreground mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full font-serif text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Order</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Customer</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Total</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="py-3 font-bold text-foreground">{order.id}</td>
                  <td className="py-3 text-foreground">{order.customerName}</td>
                  <td className="py-3 text-muted-foreground">{order.date}</td>
                  <td className="py-3 text-foreground font-bold">PKR {order.total.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${statusColor[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
