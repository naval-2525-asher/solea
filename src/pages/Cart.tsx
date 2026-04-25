import { Link } from "react-router-dom";
import { useCart, cartItemKey } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Minus, Plus, Trash2 } from "lucide-react";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <main className="bg-background min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <p className="text-foreground font-serif text-2xl font-bold mb-4">Your cart is empty</p>
          <Link to="/shop" className="bg-primary text-primary-foreground font-serif font-bold text-sm px-8 py-3 rounded-full no-underline tracking-wider uppercase hover:scale-[1.02] transition-transform">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-[700px] mx-auto px-6 py-10">
        <h1 className="text-foreground font-serif text-3xl font-black mb-8">Your Cart</h1>

        <div className="flex flex-col gap-4 mb-8">
          {items.map((item) => {
            const key = cartItemKey(item);
            return (
              <div key={key} className="flex gap-4 bg-card rounded-xl p-4 border border-border">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-serif font-bold text-sm">{item.name}</p>

                  {/* Style / size */}
                  <p className="text-foreground/60 font-serif text-xs mt-0.5">
                    {item.style === "accessory"
                      ? `Variant: ${item.size}`
                      : `${item.style === "tee" ? "Tee" : "Tank"} · Size: ${item.size}`}
                  </p>

                  {/* Customisation pills */}
                  {item.customisation && Object.keys(item.customisation).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
                      {Object.entries(item.customisation).map(([label, value]) => {
                        // detect if value looks like a CSS color (hex, rgb, named)
                        const isColor = /^#([0-9a-f]{3}){1,2}$/i.test(value) ||
                          /^rgb/.test(value) ||
                          /^[a-z]+$/i.test(value) && value.length < 20 && !value.includes(" ");
                        return (
                          <span key={label} style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "2px 8px", borderRadius: "999px",
                            background: "rgba(139,26,47,0.07)",
                            border: "1px solid rgba(139,26,47,0.18)",
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: "10.5px", fontWeight: 600, color: "#8B1A2F",
                          }}>
                            {isColor && (
                              <span style={{ width: 9, height: 9, borderRadius: "50%", background: value, border: "1px solid rgba(139,26,47,0.2)", flexShrink: 0 }} />
                            )}
                            <span style={{ opacity: 0.65 }}>{label}:</span> {value}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-foreground font-serif font-bold text-sm mt-1.5">
                    PKR {item.price.toLocaleString()}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => updateQuantity(item.productId, item.size, item.style, item.quantity - 1, key)}
                      className="w-7 h-7 rounded-full border border-border bg-transparent text-foreground flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="font-serif text-sm font-bold text-foreground w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.size, item.style, item.quantity + 1, key)}
                      className="w-7 h-7 rounded-full border border-border bg-transparent text-foreground flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.productId, item.size, item.style, key)}
                  className="bg-transparent border-none cursor-pointer text-destructive self-start p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-6 space-y-2">
          <div className="flex justify-between font-serif text-sm text-foreground/70">
            <span>Estimated Total</span>
            <span>PKR {totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-serif text-lg font-black text-foreground">
            <span>Total</span>
            <span>PKR {totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <Link to="/checkout"
          className="block w-full bg-primary text-primary-foreground text-center border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase no-underline mt-8 hover:scale-[1.02] transition-transform">
          Proceed to Checkout
        </Link>
      </div>
      <Footer />
    </main>
  );
};

export default Cart;
