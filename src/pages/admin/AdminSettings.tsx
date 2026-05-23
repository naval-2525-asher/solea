import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { MessageCircle, Save, Info } from "lucide-react";

export default function AdminSettings() {
  const { data: siteSettings = [], isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [whatsappNumber, setWhatsappNumber] = useState("03248922980");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const wa = (siteSettings as any[]).find((s: any) => s.key === "whatsapp_number");
    if (wa?.value) setWhatsappNumber(wa.value);
  }, [siteSettings]);

  const handleSave = async () => {
    const trimmed = whatsappNumber.trim();
    if (!trimmed) { toast.error("Please enter a valid WhatsApp number."); return; }
    if (!/^\+?[\d\s\-()]{7,20}$/.test(trimmed)) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setIsSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "whatsapp_number", value: trimmed });
      toast.success("WhatsApp number updated ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-serif text-2xl font-black text-foreground">Settings</h1>

      {/* WhatsApp Number in Use */}
      <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center shrink-0">
            <MessageCircle size={18} className="text-[#25D366]" />
          </div>
          <div>
            <h2 className="font-serif font-black text-foreground text-lg leading-tight">
              Number in Use
            </h2>
            <p className="font-serif text-xs text-muted-foreground">
              WhatsApp number for sending order verification messages to customers
            </p>
          </div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-xl p-4 flex items-start gap-2">
          <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="font-serif text-xs text-muted-foreground leading-relaxed">
            When you mark an order as <strong>Verified / Confirmed</strong>, you'll be reminded to
            send a WhatsApp message to the customer from this number. Supports Pakistani format
            (e.g. <strong>03248922980</strong>) and UK/international format (e.g.{" "}
            <strong>+447700900123</strong>). Update this any time your active number changes — no
            developer involvement needed.
          </p>
        </div>

        <div className="space-y-2">
          <label className="font-serif text-sm font-bold text-foreground">
            Active WhatsApp Number
          </label>
          {isLoading ? (
            <div className="h-12 rounded-xl bg-secondary animate-pulse" />
          ) : (
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. 03248922980 or +447700900123"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-serif text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          )}
          <p className="font-serif text-xs text-muted-foreground">
            Accepted formats: <code className="bg-secondary px-1 rounded">03248922980</code>,{" "}
            <code className="bg-secondary px-1 rounded">+923248922980</code>,{" "}
            <code className="bg-secondary px-1 rounded">+447700900123</code>
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 font-serif text-sm font-bold px-6 py-3 rounded-full transition-all"
          style={{
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            opacity: isSaving ? 0.7 : 1,
            cursor: isSaving ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          <Save size={15} />
          {isSaving ? "Saving…" : "Save Number"}
        </button>
      </div>

      {/* Email Notifications Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="font-serif font-black text-foreground text-lg">Email Notifications</h2>
        <p className="font-serif text-xs text-muted-foreground leading-relaxed">
          Automated emails are sent on every new order:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-serif text-xs text-[#25D366] font-bold mt-0.5">✓</span>
            <span className="font-serif text-xs text-muted-foreground">
              <strong className="text-foreground">Admin email</strong> — Sent to{" "}
              <span className="font-mono bg-secondary px-1 rounded text-[11px]">shopsoleakhi@gmail.com</span>{" "}
              with full order details and a direct link to the transaction screenshot.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-serif text-xs text-[#25D366] font-bold mt-0.5">✓</span>
            <span className="font-serif text-xs text-muted-foreground">
              <strong className="text-foreground">Customer email</strong> — Sent to the customer
              thanking them for their order and letting them know to watch their WhatsApp for
              confirmation.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-serif text-xs text-blue-500 font-bold mt-0.5">→</span>
            <span className="font-serif text-xs text-muted-foreground">
              <strong className="text-foreground">On verification</strong> — When you mark an order
              as <em>Confirmed</em>, an admin reminder email is triggered with the active WhatsApp
              number so you know which number to send the customer confirmation from.
            </span>
          </li>
        </ul>
        <p className="font-serif text-[10px] text-muted-foreground pt-1">
          Email delivery is handled by the <strong>send-order-emails</strong> Supabase Edge Function
          using Resend. Ensure <code className="bg-secondary px-1 rounded">RESEND_API_KEY</code> is
          set in your Supabase project secrets.
        </p>
      </div>
    </div>
  );
}