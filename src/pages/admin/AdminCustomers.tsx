import { useState } from "react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useAdminData";
import { ChevronDown, Mail } from "lucide-react";
import { toast } from "sonner";

const SHIPPING_OPTIONS = [
  { value: "in-production", label: "Processing", color: "#d97706", bg: "#fef3c7" },
  { value: "shipped",       label: "Shipped",    color: "#7c3aed", bg: "#ede9fe" },
  { value: "delivered",     label: "Delivered",  color: "#0891b2", bg: "#cffafe" },
  { value: "cancelled",     label: "Cancelled",  color: "#dc2626", bg: "#fee2e2" },
];

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    confirmed:      { label: "✓ Verified",    color: "#16a34a", bg: "#dcfce7" },
    "in-production":{ label: "⚙ Processing",  color: "#d97706", bg: "#fef3c7" },
    shipped:        { label: "🚚 Shipped",     color: "#7c3aed", bg: "#ede9fe" },
    delivered:      { label: "✅ Delivered",   color: "#0891b2", bg: "#cffafe" },
    cancelled:      { label: "✕ Cancelled",   color: "#dc2626", bg: "#fee2e2" },
  };
  return map[status] || { label: "● Pending", color: "#d97706", bg: "#fef3c7" };
};

const buildMailtoLink = (email: string, name: string, orderId: string, status: string) => {
  const ref = orderId.slice(0, 8).toUpperCase();
  const subjects: Record<string, string> = {
    confirmed: `Soléa – Order #${ref} Confirmed ✓`,
    shipped:   `Soléa – Order #${ref} Has Been Dispatched 🚚`,
    delivered: `Soléa – Order #${ref} Delivered ✅`,
    cancelled: `Soléa – Order #${ref} Cancellation Notice`,
  };
  const bodies: Record<string, string> = {
    confirmed: `Dear ${name},\n\nYour Soléa order #${ref} has been confirmed. You will receive all updates and confirmations via email.\n\nWarm regards,\nSoléa`,
    shipped:   `Dear ${name},\n\nYour Soléa order #${ref} has been dispatched and is on its way! You will receive all updates and confirmations via email.\n\nWarm regards,\nSoléa`,
    delivered: `Dear ${name},\n\nWe hope your Soléa order #${ref} arrived safely! Thank you for shopping with us. You will receive all updates and confirmations via email.\n\nWith love,\nSoléa`,
    cancelled: `Dear ${name},\n\nUnfortunately your Soléa order #${ref} has been cancelled. Please contact us at shopsoleakhi@gmail.com if you have any questions. You will receive all updates and confirmations via email.\n\nWarm regards,\nSoléa`,
  };
  const subject = encodeURIComponent(subjects[status] || `Soléa – Order #${ref} Update`);
  const body = encodeURIComponent(bodies[status] || bodies["confirmed"]);
  return `mailto:${email}?subject=${subject}&body=${body}`;
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
            <span style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>
              {order.region === "UK" ? `£${(item.price * item.quantity).toLocaleString("en-GB")}` : `PKR ${(item.price * item.quantity).toLocaleString()}`}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "0.9rem", paddingTop: 8, color: "hsl(var(--foreground))" }}>
          <span>Total</span>
          <span>{order.region === "UK" ? `£${Number(order.total).toLocaleString("en-GB")}` : `PKR ${Number(order.total).toLocaleString()}`}</span>
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

  // Only show VERIFIED customers (status !== pending and !== cancelled at top level)
  // One row per customer email — most recent order
  const customerMap: Record<string, any> = {};
  (orders as any[])
    .filter((o: any) => o.status !== "pending" && o.status !== "cancelled")
    .forEach((o: any) => {
      if (!customerMap[o.email]) customerMap[o.email] = o;
    });
  const customers = Object.values(customerMap);

  const handleStatus = async (id: string, status: string, customer?: any) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Status updated!");
      setOpenDropdown(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-foreground">Customers</h1>
        <span className="font-serif text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          Verified only — {customers.length} customer{customers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="font-serif text-sm text-muted-foreground">Loading...</div>
      ) : customers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center font-serif text-muted-foreground text-sm">
          No verified customers yet — verified orders will appear here.
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
                  <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Shipping Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => {
                  const badge = statusBadge(c.status);
                  const isOpen = openDropdown === c.id;
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="p-4 font-bold text-foreground">{c.first_name} {c.last_name}</td>
                      <td className="p-4 text-foreground/80 text-xs">{c.email}</td>
                      <td className="p-4 text-muted-foreground text-xs">{c.phone}</td>
                      <td className="p-4 text-muted-foreground text-xs">{c.city}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setViewOrder(c)}
                          style={{ fontFamily: "Georgia, serif", fontSize: "0.75rem", fontWeight: 700, background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "2rem", padding: "4px 14px", cursor: "pointer", color: "hsl(var(--foreground))" }}
                        >
                          View
                        </button>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-4">
                        <div style={{ position: "relative", display: "inline-block" }}>
                          {/* Status badge / dropdown trigger */}
                          <button
                            onClick={() => setOpenDropdown(isOpen ? null : c.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700,
                              background: badge.bg, border: "none", borderRadius: "2rem",
                              padding: "5px 12px", cursor: "pointer", color: badge.color,
                            }}
                          >
                            {badge.label}
                            <ChevronDown size={12} />
                          </button>

                          {isOpen && (
                            <div
                              style={{ position: "absolute", top: "110%", left: 0, zIndex: 100, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 8, minWidth: 190, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p style={{ fontFamily: "Georgia, serif", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", padding: "4px 10px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Update Shipping
                              </p>
                              {SHIPPING_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => handleStatus(c.id, opt.value, c)}
                                  style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    width: "100%", fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700,
                                    padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                                    background: c.status === opt.value ? opt.bg : "transparent",
                                    color: opt.color, marginBottom: 2, textAlign: "left",
                                  }}
                                >
                                  {opt.label}
                                  {c.status === opt.value && <span style={{ fontSize: 10 }}>✓</span>}
                                </button>
                              ))}
                              
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
