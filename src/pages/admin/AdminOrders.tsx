import { useState } from "react";
import { useOrders, useUpdateOrderStatus, useSiteSettings } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { MessageCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const statusColor: Record<string, string> = {
  pending:         "bg-yellow-100 text-yellow-800",
  confirmed:       "bg-green-100 text-green-800",
  "in-production": "bg-orange-100 text-orange-800",
  shipped:         "bg-purple-100 text-purple-800",
  delivered:       "bg-blue-100 text-blue-800",
  cancelled:       "bg-red-100 text-red-800",
};

const statuses = ["all", "pending", "confirmed", "in-production", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrders() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: siteSettings = [] } = useSiteSettings();
  const updateStatus = useUpdateOrderStatus();
  const [filter, setFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o: any) => o.status === filter);

  const waNumberSetting = (siteSettings as any[]).find((s: any) => s.key === "whatsapp_number");
  const whatsappNumber = waNumberSetting?.value || "03248922980";

  const handleStatus = async (id: string, status: string, order?: any) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      if (status === "confirmed") {
        toast.success(`✓ Order verified! WhatsApp reminder sent to admin (${whatsappNumber}).`);
        // Open WhatsApp to notify customer
        if (order) {
          const waUrl = buildWhatsAppLink(order.phone, order.first_name, order.id);
          setTimeout(() => window.open(waUrl, "_blank"), 500);
        }
      } else if (status === "cancelled") {
        toast.success("Order cancelled.");
      } else {
        toast.success(`Status updated to ${status}.`);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const buildWhatsAppLink = (phone: string, name: string, orderId: string) => {
    let n = phone.replace(/\D/g, "");
    if (n.startsWith("0") && !n.startsWith("00")) n = "92" + n.slice(1);
    const msg = encodeURIComponent(
      `Hello ${name}! 🌸 Your Soléa order #${orderId.slice(0, 8).toUpperCase()} has been verified and confirmed. We'll keep you updated on production and shipping. Thank you for shopping with us! 💕`
    );
    return `https://wa.me/${n}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-black text-foreground">Orders</h1>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`font-serif text-xs px-4 py-2 rounded-full border capitalize transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-secondary"
            }`}
          >
            {s === "all"
              ? `All (${orders.length})`
              : `${s} (${(orders as any[]).filter((o: any) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="font-serif text-sm text-muted-foreground p-4">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center font-serif text-muted-foreground text-sm">
          No orders found.
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
                  <th className="text-left p-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filtered as any[]).map((order: any) => {
                  const isExpanded = expandedOrder === order.id;
                  const isPending = !order.status || order.status === "pending";
                  const isCancelled = order.status === "cancelled";

                  return (
                    <>
                      <tr
                        key={order.id}
                        className={`border-b border-border/50 cursor-pointer hover:bg-secondary/20 ${isExpanded ? "bg-secondary/10" : ""}`}
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <td className="p-4 font-bold text-foreground">
                          {order.first_name} {order.last_name}
                          <p className="font-normal text-xs text-muted-foreground">{order.email}</p>
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">{order.city}</td>
                        <td className="p-4 text-muted-foreground text-xs">
                          {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="p-4 text-foreground font-bold">
                          {order.region === "UK" ? `£${Number(order.total).toLocaleString("en-GB")}` : `PKR ${Number(order.total).toLocaleString()}`}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${statusColor[order.status] || "bg-yellow-100 text-yellow-800"}`}>
                            {order.status || "pending"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Verify button — only for pending */}
                            {isPending && (
                              <button
                                onClick={() => handleStatus(order.id, "confirmed", order)}
                                style={{ fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "5px 12px", borderRadius: "2rem", border: "none", background: "#dcfce7", color: "#16a34a", cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                ✓ Verify
                              </button>
                            )}
                            {/* Cancel button — not for already cancelled/delivered */}
                            {!isCancelled && order.status !== "delivered" && (
                              <button
                                onClick={() => {
                                  if (confirm("Cancel this order?")) handleStatus(order.id, "cancelled");
                                }}
                                style={{ fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "5px 12px", borderRadius: "2rem", border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                ✕ Cancel
                              </button>
                            )}
                            {/* WhatsApp button */}
                            <a
                              href={buildWhatsAppLink(order.phone, order.first_name, order.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "5px 12px", borderRadius: "2rem", background: "#dcfce7", color: "#16a34a", textDecoration: "none", whiteSpace: "nowrap" }}
                            >
                              <MessageCircle size={12} />
                              WA
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${order.id}-detail`} className="bg-secondary/5 border-b border-border/30">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                              {/* Left: order info */}
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Phone:</strong> {order.phone}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Address:</strong> {order.address}, {order.city}
                                  {order.province ? `, ${order.province}` : ""}
                                  {order.postcode ? ` ${order.postcode}` : ""}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Transaction ID:</strong> {order.transaction_id}
                                </p>
                                <div className="pt-1">
                                  <p className="text-xs font-bold text-foreground mb-1">Items:</p>
                                  {(order.items || []).map((item: any, i: number) => (
                                    <p key={i} className="text-xs text-foreground/80 pl-2">
                                      • {item.name} ({item.size}) × {item.quantity} —{" "}
                                      {order.region === "UK"
                                        ? `£${(item.price * item.quantity).toLocaleString("en-GB")}`
                                        : `PKR ${(item.price * item.quantity).toLocaleString()}`}
                                    </p>
                                  ))}
                                </div>
                              </div>

                              {/* Right: screenshot + status buttons */}
                              <div className="space-y-3">
                                {order.transaction_screenshot && (
                                  <div>
                                    <p className="text-xs font-bold text-foreground mb-1">Transaction Screenshot:</p>
                                    <div className="flex items-start gap-2">
                                      <img
                                        src={order.transaction_screenshot}
                                        alt="Transaction"
                                        className="max-h-[160px] rounded-lg border border-border object-contain"
                                      />
                                      <a
                                        href={order.transaction_screenshot}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 font-serif text-xs text-primary underline mt-1"
                                      >
                                        <ExternalLink size={11} />
                                        Full image
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {/* Status update pills */}
                                <div>
                                  <p className="text-xs font-bold text-foreground mb-2">Update Status:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {["pending", "confirmed", "in-production", "shipped", "delivered", "cancelled"].map((s) => (
                                      <button
                                        key={s}
                                        onClick={() => handleStatus(order.id, s, order)}
                                        className={`font-serif text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                                          order.status === s
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-card text-foreground border-border hover:bg-secondary"
                                        }`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* WhatsApp prompt */}
                                <div className="flex items-center gap-2 pt-1">
                                  <a
                                    href={buildWhatsAppLink(order.phone, order.first_name, order.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 font-serif text-xs px-4 py-2 rounded-full no-underline transition-colors"
                                    style={{ background: "#25D366", color: "#fff" }}
                                  >
                                    <MessageCircle size={13} />
                                    Send WhatsApp to Customer
                                  </a>
                                  <span className="font-serif text-[10px] text-muted-foreground">via {whatsappNumber}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}