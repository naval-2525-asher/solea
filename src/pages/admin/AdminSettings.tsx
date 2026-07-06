import { useState } from "react";
import { Mail, Info, CheckCircle2, KeyRound, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "shopsoleakhi@gmail.com";
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

type Pending = { code: string; expiresAt: number; value: string };

function loadPending(storageKey: string): Pending | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: Pending = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// ─── Shared credential-change card (used for both username and password) ─────
// Sends a 6-digit verification code to the admin email, then on confirmation
// updates the given column on the `admin_settings` row.
interface CredentialChangeCardProps {
  icon: React.ReactNode;
  title: string;
  fieldLabel: string;
  // How the new value gets saved once the code is verified. Kept generic so
  // a field can live in localStorage (username) or in the existing
  // `admin_settings` table (password) without changing this component.
  persist: (value: string) => Promise<void>;
  storageKey: string;
  emailType: string;
  inputType?: "text" | "password";
  minLength?: number;
  validate?: (value: string) => string | null;
  note?: string;
}

function CredentialChangeCard({
  icon,
  title,
  fieldLabel,
  persist,
  storageKey,
  emailType,
  inputType = "text",
  minLength = 4,
  validate,
  note,
}: CredentialChangeCardProps) {
  const initialPending = loadPending(storageKey);
  const [step, setStep] = useState<"form" | "verify">(initialPending ? "verify" : "form");
  const [newValue, setNewValue] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<Pending | null>(initialPending);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetFlow = () => {
    setStep("form");
    setNewValue("");
    setConfirmValue("");
    setCode("");
    setPending(null);
    setError("");
    sessionStorage.removeItem(storageKey);
  };

  const sendVerificationCode = async (valueToSet: string) => {
    setError("");
    setSuccess("");
    setSending(true);
    const verificationCode = generateCode();
    try {
      await supabase.functions.invoke("send-order-emails", {
        body: {
          type: emailType,
          email: ADMIN_EMAIL,
          code: verificationCode,
        },
      });
      const next: Pending = { code: verificationCode, expiresAt: Date.now() + CODE_TTL_MS, value: valueToSet };
      sessionStorage.setItem(storageKey, JSON.stringify(next));
      setPending(next);
      setStep("verify");
    } catch (err) {
      console.error(`Failed to send verification email for ${title}:`, err);
      setError("Couldn't send the verification email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleRequestChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newValue.length < minLength) {
      setError(`${fieldLabel} must be at least ${minLength} characters.`);
      return;
    }
    if (newValue !== confirmValue) {
      setError(`${fieldLabel}s do not match.`);
      return;
    }
    const customError = validate?.(newValue);
    if (customError) {
      setError(customError);
      return;
    }
    sendVerificationCode(newValue);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pending) return;
    if (Date.now() > pending.expiresAt) {
      setError("This code has expired. Please request a new one.");
      return;
    }
    if (code.trim() !== pending.code) {
      setError("Incorrect code. Please check your email and try again.");
      return;
    }
    setSending(true);
    try {
      await persist(pending.value);
      setSuccess(`${fieldLabel} updated successfully.`);
      resetFlow();
    } catch (err: any) {
      console.error(`Failed to update ${fieldLabel}:`, err);
      setError(`Couldn't save the new ${fieldLabel.toLowerCase()}: ${err?.message || "unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-serif font-black text-foreground text-lg leading-tight">{title}</h2>
          <p className="font-serif text-xs text-muted-foreground">
            A verification code will be emailed to {ADMIN_EMAIL}
          </p>
        </div>
      </div>

      {note && (
        <p className="font-serif text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
          {note}
        </p>
      )}

      {step === "form" ? (
        <form onSubmit={handleRequestChange} className="space-y-3">
          <Input
            type={inputType}
            placeholder={`New ${fieldLabel.toLowerCase()}`}
            value={newValue}
            onChange={(e) => { setNewValue(e.target.value); setError(""); }}
            className="font-serif"
          />
          <Input
            type={inputType}
            placeholder={`Confirm new ${fieldLabel.toLowerCase()}`}
            value={confirmValue}
            onChange={(e) => { setConfirmValue(e.target.value); setError(""); }}
            className="font-serif"
          />
          {error && <p className="text-destructive font-serif text-xs">{error}</p>}
          {success && <p className="text-blue-600 font-serif text-xs">{success}</p>}
          <Button type="submit" disabled={sending} className="font-serif font-bold">
            {sending ? "Sending code…" : "Send Verification Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-3">
          <p className="font-serif text-xs text-muted-foreground leading-relaxed">
            Enter the 6-digit code sent to <strong className="text-foreground">{ADMIN_EMAIL}</strong> to confirm your new {fieldLabel.toLowerCase()}.
          </p>
          <Input
            placeholder="Verification code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            className="font-serif tracking-widest"
            maxLength={6}
          />
          {error && <p className="text-destructive font-serif text-xs">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={sending} className="font-serif font-bold">
              {sending ? "Saving…" : `Verify & Update ${fieldLabel}`}
            </Button>
            <button
              type="button"
              onClick={() => pending && sendVerificationCode(pending.value)}
              disabled={sending}
              className="font-serif text-xs text-muted-foreground underline"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={resetFlow}
              className="font-serif text-xs text-muted-foreground underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

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

      {/* Change Username */}
      {/* Stored in the same `admin_settings` row as the password, so the
          same username/password work from any browser or device. */}
      <CredentialChangeCard
        icon={<UserCog size={18} className="text-blue-600" />}
        title="Change Username"
        fieldLabel="Username"
        persist={async (value) => {
          const { error } = await (supabase as any)
            .from("admin_settings")
            .update({ admin_username: value, updated_at: new Date().toISOString() })
            .eq("id", 1);
          if (error) throw error;
        }}
        storageKey="admin_username_change_pending"
        emailType="admin_username_verification"
        inputType="text"
        minLength={3}
        validate={(value) => (/\s/.test(value) ? "Username cannot contain spaces." : null)}
      />

      {/* Change Password */}
      <CredentialChangeCard
        icon={<KeyRound size={18} className="text-blue-600" />}
        title="Change Password"
        fieldLabel="Password"
        persist={async (value) => {
          const { error } = await (supabase as any)
            .from("admin_settings")
            .update({ admin_password: value, updated_at: new Date().toISOString() })
            .eq("id", 1);
          if (error) throw error;
        }}
        storageKey="admin_pw_change_pending"
        emailType="admin_password_verification"
        inputType="password"
        minLength={4}
      />

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
