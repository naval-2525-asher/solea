import { Mail, Info, CheckCircle2 } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-serif text-2xl font-black text-foreground">Settings</h1>

      {/* Email-Only Communications Banner */}
      <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Mail size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-serif font-black text-foreground text-lg leading-tight">
              Email-Only Communications
            </h2>
            <p className="font-serif text-xs text-muted-foreground">
              All customer notifications are handled exclusively via email
            </p>
          </div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-xl p-4 flex items-start gap-2">
          <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="font-serif text-xs text-muted-foreground leading-relaxed">
            All customer communications are now handled via email only. When you update an order status in the Orders panel, your email client will automatically open with a pre-filled template addressed to the customer — ready for you to review and send.
          </p>
        </div>
      </div>

      {/* Email Notifications Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-serif font-black text-foreground text-lg">Email Notification Types</h2>
        <p className="font-serif text-xs text-muted-foreground leading-relaxed">
          The following customer-facing notifications are sent via email:
        </p>
        <ul className="space-y-3">
          {[
            { label: "Order Confirmation", desc: "Sent automatically when a new order is placed." },
            { label: "Order Verified / Confirmed", desc: "Sent when you mark an order as Confirmed." },
            { label: "In Production", desc: "Sent when production of the order begins." },
            { label: "Dispatched / Shipped", desc: "Sent when the order is shipped to the customer." },
            { label: "Out for Delivery / Delivered", desc: "Sent on final delivery confirmation." },
            { label: "Order Cancellation", desc: "Sent when an order is cancelled." },
          ].map(({ label, desc }) => (
            <li key={label} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <span className="font-serif text-xs text-muted-foreground">
                <strong className="text-foreground">{label}</strong> — {desc}
              </span>
            </li>
          ))}
        </ul>
        <div className="bg-secondary/40 border border-border rounded-xl p-4 flex items-start gap-2 mt-2">
          <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="font-serif text-xs text-muted-foreground leading-relaxed">
            Automated order confirmation emails are handled by the <strong>send-order-emails</strong> Supabase Edge Function using Resend. Ensure{" "}
            <code className="bg-secondary px-1 rounded">RESEND_API_KEY</code> is set in your Supabase project secrets. For all other status updates, use the pre-filled email templates in the <strong>Orders</strong> panel.
          </p>
        </div>
      </div>

      {/* Admin Contact */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="font-serif font-black text-foreground text-lg">Admin Email</h2>
        <p className="font-serif text-xs text-muted-foreground leading-relaxed">
          New order notifications and admin alerts are sent to:
        </p>
        <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-4 py-3">
          <Mail size={14} className="text-muted-foreground shrink-0" />
          <span className="font-mono text-sm text-foreground font-bold">shopsoleakhi@gmail.com</span>
        </div>
      </div>
    </div>
  );
}
