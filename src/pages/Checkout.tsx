import { useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Paperclip, CheckCircle2, Lock } from "lucide-react";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  // Payment proof state
  const [txnImage, setTxnImage] = useState<File | null>(null);
  const [txnImagePreview, setTxnImagePreview] = useState<string | null>(null);
  const [txnId, setTxnId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shipping form
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
  });

  const paymentDone = txnImage !== null && txnId.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTxnImage(file);
    const reader = new FileReader();
    reader.onload = () => setTxnImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDone) {
      toast({
        title: "Payment proof required",
        description: "Please attach your transaction screenshot and enter the transaction ID.",
        variant: "destructive",
      });
      return;
    }
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.province
    ) {
      toast({ title: "Please fill in all shipping details", variant: "destructive" });
      return;
    }
    toast({
      title: "Order placed! 🎉",
      description: "We'll confirm your order once payment is verified. Thank you!",
    });
    clearCart();
    navigate("/");
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const inputBase =
    "w-full px-4 py-3 rounded-xl border font-serif text-sm outline-none transition-all";
  const inputEnabled = `${inputBase} border-border bg-card text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary/30`;
  const inputDisabled = `${inputBase} border-border/40 bg-muted text-foreground/30 placeholder:text-foreground/20 cursor-not-allowed`;

  const pakistanProvinces = [
    "Punjab",
    "Sindh",
    "Khyber Pakhtunkhwa",
    "Balochistan",
    "Gilgit-Baltistan",
    "Azad Kashmir",
    "Islamabad Capital Territory",
  ];

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-[600px] mx-auto px-6 py-10">
        <h1 className="text-foreground font-serif text-3xl font-black mb-8">
          Checkout
        </h1>

        {/* Production disclaimer */}
        <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-4 mb-8">
          <p className="text-destructive font-serif text-sm font-bold leading-relaxed">
            ⚠ Since each embroidery is meticulously hand beaded to order,
            please allow up to two weeks for production before shipping.
          </p>
        </div>

        {/* Bank Details */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-foreground font-serif font-black text-lg mb-1">
            Bank Deposit
          </h2>
          <div className="border-t border-border my-3" />
          <p className="text-foreground/80 font-serif text-sm leading-relaxed mb-4">
            Transfer the total amount to the account below, then attach your
            transaction screenshot and enter your Transaction ID to proceed.
          </p>
          <div className="space-y-1.5 font-serif text-sm text-foreground/90">
            <p>
              <span className="font-bold">Bank Name:</span> Bank Alfalah
            </p>
            <p>
              <span className="font-bold">Branch:</span> DHA Branch, Karachi
              (Code: 0014)
            </p>
            <p>
              <span className="font-bold">Account Title:</span> BELA SULTAN
            </p>
            <p>
              <span className="font-bold">Account Number:</span>{" "}
              00141008806071
            </p>
            <p>
              <span className="font-bold">IBAN:</span>{" "}
              PK08ALFH0014001008806071
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-foreground font-serif font-black text-lg mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.style}`}
                className="flex justify-between items-center font-serif text-sm"
              >
                <span className="text-foreground">
                  {item.name} · {item.size} × {item.quantity}
                </span>
                <span className="text-foreground font-bold">
                  PKR {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border my-3" />
          <div className="flex justify-between font-serif text-lg font-black text-foreground">
            <span>Total</span>
            <span>PKR {totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* ── Payment Proof Section ── */}
        <div className="bg-card border-2 border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-foreground font-serif font-black text-lg">
              Payment Proof
            </h2>
            {paymentDone && (
              <CheckCircle2 size={20} className="text-green-500" />
            )}
          </div>
          <p className="text-foreground/60 font-serif text-xs mb-5">
            Required before filling shipping details
          </p>

          {/* Screenshot upload */}
          <p className="text-foreground font-serif text-sm font-bold mb-2">
            Transaction Screenshot
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {txnImagePreview ? (
            <div className="relative mb-4">
              <img
                src={txnImagePreview}
                alt="Transaction screenshot"
                className="w-full max-h-[220px] object-contain rounded-xl border border-border"
              />
              <button
                onClick={() => {
                  setTxnImage(null);
                  setTxnImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center text-xs font-black border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer bg-transparent hover:bg-secondary/40 transition-colors mb-4"
            >
              <Paperclip size={24} className="text-foreground/50" />
              <span className="font-serif text-sm text-foreground/60">
                Tap to attach screenshot
              </span>
              <span className="font-serif text-xs text-foreground/40">
                JPG, PNG, HEIC supported
              </span>
            </button>
          )}

          {/* Transaction ID */}
          <p className="text-foreground font-serif text-sm font-bold mb-2">
            Transaction ID / Reference Number
          </p>
          <input
            type="text"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            placeholder="e.g. TXN-20250318-001234"
            className={inputEnabled}
          />
          <p className="text-foreground/40 font-serif text-xs mt-1.5">
            Found in your bank app under transaction details
          </p>
        </div>

        {/* ── Shipping Details ── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-foreground font-serif font-black text-lg">
              Shipping Details
            </h2>
            {!paymentDone && (
              <Lock size={16} className="text-foreground/30" />
            )}
          </div>
          {!paymentDone && (
            <p className="text-foreground/40 font-serif text-xs -mt-2 mb-2">
              Attach screenshot & enter Transaction ID above to unlock
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              disabled={!paymentDone}
              className={paymentDone ? inputEnabled : inputDisabled}
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              disabled={!paymentDone}
              className={paymentDone ? inputEnabled : inputDisabled}
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            disabled={!paymentDone}
            className={paymentDone ? inputEnabled : inputDisabled}
          />

          <input
            name="phone"
            type="tel"
            placeholder="Phone Number (e.g. 0300-1234567)"
            value={form.phone}
            onChange={handleChange}
            disabled={!paymentDone}
            className={paymentDone ? inputEnabled : inputDisabled}
          />

          <input
            name="address"
            placeholder="Full Shipping Address"
            value={form.address}
            onChange={handleChange}
            disabled={!paymentDone}
            className={paymentDone ? inputEnabled : inputDisabled}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              disabled={!paymentDone}
              className={paymentDone ? inputEnabled : inputDisabled}
            />
            <select
              name="province"
              value={form.province}
              onChange={handleChange}
              disabled={!paymentDone}
              className={
                paymentDone
                  ? `${inputEnabled} appearance-none`
                  : `${inputDisabled} appearance-none`
              }
            >
              <option value="">Province</option>
              {pakistanProvinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!paymentDone}
            className="w-full border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase mt-4 transition-all"
            style={{
              backgroundColor: paymentDone
                ? "hsl(var(--primary))"
                : "hsl(var(--border))",
              color: paymentDone
                ? "hsl(var(--primary-foreground))"
                : "hsl(var(--foreground)/0.3)",
              cursor: paymentDone ? "pointer" : "not-allowed",
              transform: "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (paymentDone)
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            {paymentDone ? "Complete Order" : "Complete Payment Proof First"}
          </button>
        </form>
      </div>
      <Footer />
    </main>
  );
};

export default Checkout;