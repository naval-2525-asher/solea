import { useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Paperclip, CheckCircle2, Lock, Truck } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import { useInsertOrder, uploadFile } from "@/hooks/useAdminData";

// ── City / Delivery Config ────────────────────────────────────────────────────
const PK_CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Other"];
const UK_CITIES = ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Bristol", "Edinburgh", "Sheffield", "Cardiff", "Other"];
const PK_PROVINCES = ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad Capital Territory"];

const getPKDelivery = (city: string, subtotal: number) => {
  if (subtotal >= 10000) return 0;
  return city === "Karachi" ? 350 : 450;
};

const getUKDelivery = (subtotal: number) => {
  if (subtotal >= 80) return 0;
  return 4.99;
};

const getDelivery = (region: string, city: string, subtotal: number) => {
  if (region === "UK") return getUKDelivery(subtotal);
  return getPKDelivery(city, subtotal);
};

// ── Email validation ──────────────────────────────────────────────────────────
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Phone helpers ─────────────────────────────────────────────────────────────
const formatPhone = (value: string, isUK: boolean) => {
  // Strip everything except digits and +
  let digits = value.replace(/[^\d]/g, "");
  if (isUK) {
    // UK: max 10 digits after country code (44)
    if (digits.startsWith("44")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    return digits ? `+44 ${digits}` : "";
  } else {
    // PK: max 10 digits after country code (92)
    if (digits.startsWith("92")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    return digits ? `+92 ${digits}` : "";
  }
};

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { region } = useRegion();
  const isUK = region === "UK";
  const insertOrder = useInsertOrder();

  const formatPrice = (price: number) =>
    isUK ? `£${price.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `PKR ${price.toLocaleString()}`;

  // Payment proof
  const [txnImage, setTxnImage] = useState<File | null>(null);
  const [txnImagePreview, setTxnImagePreview] = useState<string | null>(null);
  const [txnId, setTxnId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shipping form
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", cityOther: "", province: "", postcode: "",
  });
  const [emailError, setEmailError] = useState("");
  const [cityMode, setCityMode] = useState<"select" | "other">("select");

  const city = form.city === "Other" ? form.cityOther : form.city;
  const delivery = getDelivery(region, city, totalPrice);
  const grandTotal = totalPrice + delivery;
  const paymentDone = txnImage !== null;
  const freeThreshold = isUK ? "£80" : "PKR 10,000";
  const deliveryMsg = delivery === 0
    ? "🎉 Free delivery!"
    : isUK
      ? `£4.99 delivery · Free over £80`
      : city === "Karachi"
        ? "PKR 350 delivery · Free over PKR 10,000"
        : city
          ? "PKR 450 delivery · Free over PKR 10,000"
          : "Select city to see delivery charges";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTxnImage(file);
    const reader = new FileReader();
    reader.onload = () => setTxnImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setForm((p) => ({ ...p, email: value }));
      setEmailError(value && !isValidEmail(value) ? "Please enter a valid email address" : "");
      return;
    }
    if (name === "phone") {
      setForm((p) => ({ ...p, phone: formatPhone(value, isUK) }));
      return;
    }
    if (name === "city") {
      setCityMode(value === "Other" ? "other" : "select");
      setForm((p) => ({ ...p, city: value, cityOther: "" }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDone) { toast.error("Please upload your transaction screenshot"); return; }
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !city || (isUK ? !form.postcode : !form.province)) {
      toast.error("Please fill in all shipping details");
      return;
    }
    if (!isValidEmail(form.email)) { toast.error("Please enter a valid email address"); return; }

    try {
      let screenshotUrl = "";
      if (txnImage) screenshotUrl = await uploadFile(txnImage, "transactions");

      await insertOrder.mutateAsync({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city,
        province: form.province || null,
        postcode: form.postcode || null,
        region,
        items,
        total: grandTotal,
        transaction_id: txnId || null,
        transaction_screenshot: screenshotUrl,
        status: "pending",
        delivery_charge: delivery,
      });

      toast.success("Order placed! 🎉 We'll verify your payment shortly.");
      clearCart();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Error placing order");
    }
  };

  if (items.length === 0) { navigate("/cart"); return null; }

  const inputBase = "w-full px-4 py-3 rounded-xl border font-serif text-sm outline-none transition-all";
  const inputEnabled = `${inputBase} border-border bg-card text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary/30`;
  const inputDisabled = `${inputBase} border-border/40 bg-muted text-foreground/30 cursor-not-allowed`;

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-[600px] mx-auto px-6 py-10">
        <h1 className="text-foreground font-serif text-3xl font-black mb-8">Checkout</h1>

        {/* Production disclaimer */}
        <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-4 mb-8">
          <p className="text-destructive font-serif text-sm font-bold leading-relaxed">
            ⚠ Since each embroidery is meticulously hand beaded to order, please allow up to two weeks for production before shipping.
          </p>
        </div>

        {/* 1. SHIPPING DETAILS */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-foreground font-serif font-black text-lg mb-4">1. Shipping Details</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className={inputEnabled} />
              <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} className={inputEnabled} />
            </div>

            <div>
              <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} className={inputEnabled} />
              {emailError && <p className="font-serif text-xs text-destructive mt-1">{emailError}</p>}
            </div>

            <div>
              <input
                name="phone"
                type="tel"
                placeholder={isUK ? "+44 7700 000000" : "+92 300 0000000"}
                value={form.phone}
                onChange={handleChange}
                maxLength={isUK ? 14 : 14}
                className={inputEnabled}
              />
            </div>

            <input name="address" placeholder="Full Shipping Address" value={form.address} onChange={handleChange} className={inputEnabled} />

            {/* City dropdown */}
            <div>
              <select name="city" value={form.city} onChange={handleChange} className={`${inputEnabled} appearance-none`}>
                <option value="">Select City</option>
                {(isUK ? UK_CITIES : PK_CITIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.city === "Other" && (
                <input
                  name="cityOther"
                  placeholder="Enter your city"
                  value={form.cityOther}
                  onChange={handleChange}
                  className={`${inputEnabled} mt-2`}
                />
              )}
            </div>

            {/* Province / Postcode */}
            {isUK ? (
              <input name="postcode" placeholder="Postcode (e.g. SW1A 1AA)" value={form.postcode} onChange={handleChange} className={inputEnabled} />
            ) : (
              <select name="province" value={form.province} onChange={handleChange} className={`${inputEnabled} appearance-none`}>
                <option value="">Select Province</option>
                {PK_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}

            {/* Delivery info */}
            {(city || isUK) && (
              <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-4 py-3">
                <Truck size={16} className="text-foreground/60 flex-shrink-0" />
                <p className="font-serif text-sm text-foreground/80">{deliveryMsg}</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. BANK DETAILS */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-foreground font-serif font-black text-lg mb-1">2. Bank Details</h2>
          <div className="border-t border-border my-3" />
          {isUK ? (
            <>
              <p className="text-foreground/80 font-serif text-sm leading-relaxed">
                UK payments are processed via bank transfer. Please contact us at <span className="font-bold">shopsoleakhi@gmail.com</span> to arrange payment before completing your order.
              </p>
              <div className="mt-4 bg-secondary/40 rounded-xl p-4 font-serif text-sm text-foreground/70">
                <p>All prices are in <span className="font-bold text-foreground">GBP (£)</span>. Your order total will be confirmed via email.</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-foreground/80 font-serif text-sm leading-relaxed mb-4">
                Transfer the total amount to the account below, then attach your transaction screenshot to proceed.
              </p>
              <div className="space-y-1.5 font-serif text-sm text-foreground/90">
                <p><span className="font-bold">Bank Name:</span> Bank Alfalah</p>
                <p><span className="font-bold">Branch:</span> DHA Branch, Karachi (Code: 0014)</p>
                <p><span className="font-bold">Account Title:</span> BELA SULTAN</p>
                <p><span className="font-bold">Account Number:</span> 00141008806071</p>
                <p><span className="font-bold">IBAN:</span> PK08ALFH0014001008806071</p>
              </div>
            </>
          )}
        </div>

        {/* 3. ORDER SUMMARY */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-foreground font-serif font-black text-lg mb-4">3. Order Summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.style}`} className="flex justify-between items-start font-serif text-sm">
                <span className="text-foreground">{item.name} · {item.size} × {item.quantity}</span>
                <span className="text-foreground font-bold ml-4 flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border my-3" />
          <div className="flex justify-between font-serif text-sm text-foreground/70 mb-1">
            <span>Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between font-serif text-sm text-foreground/70 mb-3">
            <span>Delivery</span>
            <span>{delivery === 0 ? <span className="text-green-600 font-bold">Free</span> : formatPrice(delivery)}</span>
          </div>
          <div className="flex justify-between font-serif text-lg font-black text-foreground">
            <span>Total Payable</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
          {delivery > 0 && (
            <p className="font-serif text-xs text-foreground/50 mt-1 text-right">
              Add {isUK ? `£${(80 - totalPrice).toFixed(2)} more` : `PKR ${(10000 - totalPrice).toLocaleString()} more`} for free delivery
            </p>
          )}
        </div>

        {/* 4. TRANSACTION SCREENSHOT */}
        <form onSubmit={handleSubmit}>
          <div className={`bg-card border-2 rounded-xl p-6 mb-8 ${paymentDone ? "border-green-500/50" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-foreground font-serif font-black text-lg">4. Transaction Screenshot</h2>
              {paymentDone && <CheckCircle2 size={20} className="text-green-500" />}
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="font-serif text-xs text-amber-800 font-bold">
                ⚠ Please review your updated cart total above (including delivery charges) before transferring the amount.
              </p>
            </div>

            <p className="text-foreground font-serif text-sm font-bold mb-2">Upload Screenshot</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {txnImagePreview ? (
              <div className="relative mb-4">
                <img src={txnImagePreview} alt="Transaction screenshot" className="w-full max-h-[220px] object-contain rounded-xl border border-border" />
                <button
                  type="button"
                  onClick={() => { setTxnImage(null); setTxnImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center text-xs font-black border-none cursor-pointer"
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer bg-transparent hover:bg-secondary/40 transition-colors mb-4"
              >
                <Paperclip size={24} className="text-foreground/50" />
                <span className="font-serif text-sm text-foreground/60">Tap to attach screenshot</span>
                <span className="font-serif text-xs text-foreground/40">JPG, PNG, HEIC supported</span>
              </button>
            )}

            <p className="text-foreground font-serif text-sm font-bold mb-2">Transaction ID (optional)</p>
            <input type="text" value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. TXN-20250318-001234" className={inputEnabled} />
            <p className="text-foreground/40 font-serif text-xs mt-1.5">Found in your bank app under transaction details</p>
          </div>

          {!paymentDone && (
            <p className="font-serif text-xs text-destructive text-center mb-3 font-bold">
              ⚠ Please upload your transaction screenshot before completing the order.
            </p>
          )}

          <button
            type="submit"
            disabled={!paymentDone}
            className="w-full border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase transition-all"
            style={{
              backgroundColor: paymentDone ? "hsl(var(--primary))" : "hsl(var(--border))",
              color: paymentDone ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground)/0.3)",
              cursor: paymentDone ? "pointer" : "not-allowed",
            }}
          >
            {paymentDone ? "Complete Order" : "Upload Screenshot to Continue"}
          </button>
        </form>
      </div>
      <Footer />
    </main>
  );
};

export default Checkout;