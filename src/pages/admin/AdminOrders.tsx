import { useState } from "react";
import { mockOrders, type Order } from "@/lib/mockAdminData";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  "in-production": "bg-accent/30 text-foreground",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
};

const statuses = ["all", "pending", "confirmed", "in-production", "shipped", "delivered"] as const;

export default function AdminOrders() {
  const [filter, setFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filtered = filter === "all" ? mockOrders : mockOrders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-black text-foreground">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`font-serif text-xs px-4 py-2 rounded-full border capitalize transition-colors ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-secondary"
            }`}
          >
            {s === "all" ? `All (${mockOrders.length})` : `${s} (${mockOrders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-serif text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Order ID</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Customer</th>
                <th className="text-left p-4 text-muted-foreground font-medium">City</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Total</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="border-b border-border/50 cursor-pointer hover:bg-secondary/20"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <td className="p-4 font-bold text-foreground">{order.id}</td>
                    <td className="p-4 text-foreground">{order.customerName}</td>
                    <td className="p-4 text-muted-foreground">{order.city}</td>
                    <td className="p-4 text-muted-foreground">{order.date}</td>
                    <td className="p-4 text-foreground font-bold">PKR {order.total.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${statusColor[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-detail`} className="bg-secondary/10">
                      <td colSpan={6} className="p-4">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            <strong>Email:</strong> {order.email} &nbsp;|&nbsp; <strong>Phone:</strong> {order.phone}
                          </p>
                          <p className="text-xs font-bold text-foreground">Items:</p>
                          {order.items.map((item, i) => (
                            <p key={i} className="text-xs text-foreground/80 pl-2">
                              • {item.name} ({item.style}, {item.size}) × {item.quantity} — PKR {(item.price * item.quantity).toLocaleString()}
                            </p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
