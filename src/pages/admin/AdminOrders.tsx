import { useState } from "react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useAdminData";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  "in-production": "bg-orange-100 text-orange-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
};

const statuses = ["all", "pending", "confirmed", "in-production", "shipped", "delivered"] as const;

export default function AdminOrders() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filter, setFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o: any) => o.status === filter);

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

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
            {s === "all" ? `All (${orders.length})` : `${s} (${orders.filter((o: any) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="font-serif text-sm text-muted-foreground p-4">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center font-serif text-muted-foreground text-sm">
          No orders yet.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full font-serif text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Customer</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">City</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Total</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: any) => (
                  <>
                    <tr
                      key={order.id}
                      className="border-b border-border/50 cursor-pointer hover:bg-secondary/20"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <td className="p-4 font-bold text-foreground">{order.first_name} {order.last_name}</td>
                      <td className="p-4 text-muted-foreground">{order.city}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-4 text-foreground font-bold">PKR {Number(order.total).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${statusColor[order.status] || "bg-yellow-100 text-yellow-800"}`}>
                          {order.status || "pending"}
                        </span>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr key={`${order.id}-detail`} className="bg-secondary/10">
                        <td colSpan={5} className="p-4">
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              <strong>Email:</strong> {order.email} &nbsp;|&nbsp; <strong>Phone:</strong> {order.phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Address:</strong> {order.address}, {order.city}{order.province ? `, ${order.province}` : ""}{order.postcode ? ` ${order.postcode}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Transaction ID:</strong> {order.transaction_id}
                            </p>
                            <p className="text-xs font-bold text-foreground mt-2">Items:</p>
                            {(order.items || []).map((item: any, i: number) => (
                              <p key={i} className="text-xs text-foreground/80 pl-2">
                                • {item.name} ({item.size}) × {item.quantity} — PKR {(item.price * item.quantity).toLocaleString()}
                              </p>
                            ))}
                            {order.transaction_screenshot && (
                              <div className="mt-2">
                                <p className="text-xs font-bold text-foreground mb-1">Transaction Screenshot:</p>
                                <img src={order.transaction_screenshot} alt="Transaction" className="max-h-[200px] rounded-lg border border-border object-contain" />
                              </div>
                            )}
                            {/* Status update */}
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-bold text-foreground mb-2">Update Status:</p>
                              <div className="flex flex-wrap gap-2">
                                {["pending", "confirmed", "in-production", "shipped", "delivered"].map((s) => (
                                  <button
                                    key={s}
                                    onClick={(e) => { e.stopPropagation(); handleStatus(order.id, s); }}
                                    className={`font-serif text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                                      order.status === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-secondary"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
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
      )}
    </div>
  );
}