import { useState } from "react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useAdminData";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "in-production", label: "Processing", color: "#d97706" },
  { value: "shipped", label: "Shipped", color: "#7c3aed" },
  { value: "delivered", label: "Delivered", color: "#0891b2" },
];

const statusLabel = (status: string) => {
  if (status === "confirmed") return { label: "✓ Verified", color: "#16a34a" };
  if (status === "in-production") return { label: "⚙ Processing", color: "#d97706" };
  if (status === "shipped") return { label: "🚚 Shipped", color: "#7c3aed" };
  if (status === "delivered") return { label: "✅ Delivered", color: "#0891b2" };
  if (status === "cancelled") return { label: "✕ Cancelled", color: "#dc2626" };
  return { label: "● Pending", color: "#d97706" };
};

const OrderModal = ({ order, onClose }: { order: any; onClose: () => void }) => (
  <div
    onClick={onClose}
    style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ background: "hsl(var(--card))", borderRadius: 16, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: 24, position: "relative" }}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "hsl(var(--destructive))", color: "#fff", border: "none", cursor: "pointer", fontWeight: 900, fontSize: 14 }}
      >✕</button>

      <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "1.1rem", color: "hsl(var(--foreground))", marginBottom: 16 }}>
        Order Details
      </h2>

      <div style={{ background: "hsl(var(--secondary))", borderRadius: 10, padding: 12, marginBottom: 14, fontFamily: "Georgia, serif", fontSize: "0.82rem", color: "hsl(var(--foreground))", lineHeight: 1.8 }}>
        <p><b>Name:</b> {order.first_name} {order.last_name}</p>
        <p><b>Email:</b> {order.email}</p>
        <p><b>Phone:</b> {order.phone}</p>
        <p><b>Address:</b> {order.address}, {order.city}{order.province ? `, ${order.province}` : ""}{order.postcode ? ` ${order.postcode}` : ""}</p>
        <p><b>Transaction ID:</b> {order.transaction_id}</p>
      </div>

      <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "0.85rem", color: "hsl(var(--foreground))", marginBottom: 8 }}>Items Ordered</h3>
      <div style={{ marginBottom: 12 }}>
        {(order.items || []).map((item: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Georgia, serif", fontSize: "0.8rem", padding: "6px 0", borderBottom: "1px solid hsl(var(--border))" }}>
            <span style={{ color: "hsl(var(--foreground))" }}>{item.name} · {item.size} × {item.quantity}</span>
            <span style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>PKR {(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "0.9rem", paddingTop: 8, color: "hsl(var(--foreground))" }}>
          <span>Total</span>
          <span>PKR {Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      {order.transaction_screenshot && (
        <>
          <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "0.85rem", color: "hsl(var(--foreground))", marginBottom: 8 }}>Transaction Screenshot</h3>
          <img src={order.transaction_screenshot} alt="Transaction" style={{ width: "100%", borderRadius: 10, border: "1px solid hsl(var(--border))", objectFit: "contain", maxHeight: 300 }} />
        </>
      )}
    </div>
  </div>
);

export default function AdminCustomers() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<any | null>(null);

  // One row per customer (most recent order per email), already sorted descending
  const customerMap: Record<string, any> = {};
  orders.forEach((o: any) => {
    if (!customerMap[o.email]) customerMap[o.email] = o;
  });
  const customers = Object.values(customerMap);

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated!`);
      setOpenDropdown(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-black text-foreground">Customers</h1>

      {isLoading ? (
        <div className="font-serif text-sm text-muted-foreground">Loading...</div>
      ) : customers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center font-serif text-muted-foreground text-sm">
          No customers yet — they'll appear here after placing an order.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full font-serif text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Email</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Phone</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">City</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Order</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Date of Order</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => {
                  const sl = statusLabel(c.status);
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="p-4 font-bold text-foreground">{c.first_name} {c.last_name}</td>
                      <td className="p-4 text-foreground/80">{c.email}</td>
                      <td className="p-4 text-muted-foreground">{c.phone}</td>
                      <td className="p-4 text-muted-foreground">{c.city}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setViewOrder(c)}
                          style={{ fontFamily: "Georgia, serif", fontSize: "0.75rem", fontWeight: 700, background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "2rem", padding: "4px 14px", cursor: "pointer", color: "hsl(var(--foreground))" }}
                        >
                          View Order
                        </button>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-4">
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)}
                            style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "2rem", padding: "4px 12px", cursor: "pointer", color: sl.color }}
                          >
                            {sl.label}
                            <ChevronDown size={12} />
                          </button>

                          {openDropdown === c.id && (
                            <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 100, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: 8, minWidth: 170, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                              {STATUS_OPTIONS.map((opt) => (
                                <label
                                  key={opt.value}
                                  style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700, padding: "8px 12px", borderRadius: 6, cursor: "pointer", color: opt.color, marginBottom: 2 }}
                                >
                                  <input
                                    type="radio"
                                    name={`status-${c.id}`}
                                    checked={c.status === opt.value}
                                    onChange={() => handleStatus(c.id, opt.value)}
                                    style={{ accentColor: opt.color }}
                                  />
                                  {opt.label}
                                </label>
                              ))}
                              <div style={{ borderTop: "1px solid hsl(var(--border))", marginTop: 6, paddingTop: 6, display: "flex", flexDirection: "column", gap: 6, padding: "6px 8px" }}>
                                <button
                                  onClick={() => handleStatus(c.id, "confirmed")}
                                  style={{ fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700, padding: "7px 12px", borderRadius: 6, border: "none", background: c.status === "confirmed" ? "#16a34a" : "#dcfce7", color: c.status === "confirmed" ? "#fff" : "#16a34a", cursor: "pointer", textAlign: "left" }}
                                >
                                  ✓ Verify Order
                                </button>
                                <button
                                  onClick={() => handleStatus(c.id, "cancelled")}
                                  style={{ fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700, padding: "7px 12px", borderRadius: 6, border: "none", background: c.status === "cancelled" ? "#dc2626" : "#fee2e2", color: c.status === "cancelled" ? "#fff" : "#dc2626", cursor: "pointer", textAlign: "left" }}
                                >
                                  ✕ Cancel Order
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewOrder && <OrderModal order={viewOrder} onClose={() => setViewOrder(null)} />}
    </div>
  );
}