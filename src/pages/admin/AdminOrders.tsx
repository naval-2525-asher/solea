import { useState } from "react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { Mail, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const statusColor: Record<string, string> = {
  pending:         "bg-yellow-100 text-yellow-800",
  confirmed:       "bg-green-100 text-green-800",
  "in-production": "bg-orange-100 text-orange-800",
  shipped:         "bg-purple-100 text-purple-800",
  delivered:       "bg-blue-100 text-blue-800",
  cancelled:       "bg-red-100 text-red-800",
};

const statuses = ["all", "pending", "confirmed", "in-production", "shipped", "delivered", "cancelled"] as const;

// ── Email template builder ────────────────────────────────────────────────────
function buildMailtoLink(order: any, status: string): string {
  const ref = order.id.slice(0, 8).toUpperCase();
  const name = order.first_name;
  const email = order.email;

  const subjects: Record<string, string> = {
    pending:          `Soléa – Order #${ref} Received`,
    confirmed:        `Soléa – Order #${ref} Confirmed ✓`,
    "in-production":  `Soléa – Order #${ref} Is Now In Production`,
    shipped:          `Soléa – Order #${ref} Has Been Dispatched 🚚`,
    delivered:        `Soléa – Order #${ref} Delivered ✅`,
    cancelled:        `Soléa – Order #${ref} Cancellation Notice`,
  };

  const bodies: Record<string, string> = {
    pending: `Dear ${name},

Thank you for your order with Soléa! 🌸

We have received your order #${ref} and are currently reviewing your payment. You will receive all updates and confirmations via email.

We'll be in touch shortly once your payment has been verified.

Warm regards,
Soléa`,

    confirmed: `Dear ${name},

Great news! 🌸 Your Soléa order #${ref} has been verified and confirmed.

We will now begin preparing your order. Since each piece is meticulously hand-beaded to order, please allow up to two weeks for production before shipping.

You will receive all updates and confirmations via email.

Warm regards,
Soléa`,

    "in-production": `Dear ${name},

Your Soléa order #${ref} is now in production! ⚙️

Our artisans are carefully hand-beading your piece. We estimate it will be ready for dispatch within the next few days.

You will receive all updates and confirmations via email.

Warm regards,
Soléa`,

    shipped: `Dear ${name},

Wonderful news — your Soléa order #${ref} is on its way! 🚚

Your order has been dispatched and is now with the courier. Please allow the estimated delivery timeframe for your region.

You will receive all updates and confirmations via email.

Warm regards,
Soléa`,

    delivered: `Dear ${name},

We hope your Soléa order #${ref} has arrived safely! ✅

Thank you so much for shopping with us. We'd love to hear your feedback — feel free to reply to this email.

You will receive all updates and confirmations via email.

With love,
Soléa`,

    cancelled: `Dear ${name},

We're sorry to inform you that your Soléa order #${ref} has been cancelled.

If you have any questions or would like to place a new order, please don't hesitate to reach out to us at shopsoleakhi@gmail.com.

You will receive all updates and confirmations via email.

Warm regards,
Soléa`,
  };

  const subject = encodeURIComponent(subjects[status] || `Soléa – Order #${ref} Update`);
  const body = encodeURIComponent(bodies[status] || bodies["confirmed"]);
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
}

export default function AdminOrders() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filter, setFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o: any) => o.status === filter);

  const handleStatus = async (id: string, status: string, order?: any) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}.`);
      // Auto-open Gmail compose for customer-facing status changes
      if (order && ["confirmed", "in-production", "shipped", "delivered", "cancelled"].includes(status)) {
        const gmailUrl = buildMailtoLink(order, status);
        setTimeout(() => window.open(gmailUrl, "_blank"), 400);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
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
                                  if (confirm("Cancel this order?")) handleStatus(order.id, "cancelled", order);
                                }}
                                style={{ fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "5px 12px", borderRadius: "2rem", border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                ✕ Cancel
                              </button>
                            )}
                            {/* Email button */}
                            <a
                              href={buildMailtoLink(order, order.status || "confirmed")}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "5px 12px", borderRadius: "2rem", background: "#dbeafe", color: "#1d4ed8", textDecoration: "none", whiteSpace: "nowrap" }}
                            >
                              <Mail size={12} />
                              Email
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
                                  <strong>Email:</strong> {order.email}
                                </p>
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

                                {/* Email notification buttons */}
                                <div className="space-y-2 pt-1">
                                  <p className="text-xs font-bold text-foreground">Email Customer:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {["confirmed", "in-production", "shipped", "delivered", "cancelled"].map((s) => {
                                      const labels: Record<string, string> = {
                                        confirmed: "✓ Order Confirmed",
                                        "in-production": "⚙ In Production",
                                        shipped: "🚚 Dispatched",
                                        delivered: "✅ Delivered",
                                        cancelled: "✕ Cancelled",
                                      };
                                      return (
                                        <a
                                          key={s}
                                          href={buildMailtoLink(order, s)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 font-serif text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:bg-secondary transition-colors no-underline"
                                        >
                                          <Mail size={11} />
                                          {labels[s]}
                                        </a>
                                      );
                                    })}
                                  </div>
                                  <p className="font-serif text-[10px] text-muted-foreground">
                                    Opens your email client with a pre-filled template. You can edit before sending.
                                  </p>
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
