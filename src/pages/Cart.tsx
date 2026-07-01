import { Link } from "react-router-dom";
import { useCart, cartItemKey, CartItem } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import { useProducts } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { getEffectiveStock, isProductManuallyOOS } from "@/lib/inventory";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, totalPriceGbp } = useCart();
  const { data: products = [] } = useProducts();
  const { regionConfig } = useRegion();
  const isUK = regionConfig.code === "UK";

  // Build a product lookup map: id → product row
  const productMap = new Map(
    (products as any[]).map((p: any) => [String(p.id), p])
  );

  const getStock = (item: { productId: number | string; size: string; style: string }): number => {
    const p = productMap.get(String(item.productId));
    if (!p) return Infinity;
    return getEffectiveStock(p, item.style, item.size);
  };

  const isOOS = (item: { productId: number | string; size: string; style: string }): boolean => {
    const p = productMap.get(String(item.productId));
    if (!p) return false;
    if (isProductManuallyOOS(p)) return true;
    const stock = getStock(item);
    return stock !== Infinity && stock <= 0;
  };

  // Get the display price for a cart item in the current region
  const getItemDisplayPrice = (item: CartItem): number => {
    if (isUK && item.priceGbp != null) return item.priceGbp;
    return item.price;
  };

  const formatCartPrice = (price: number) => {
    if (isUK) return `£${price.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `Rs. ${price.toLocaleString()}`;
  };

  const displayTotal = isUK && totalPriceGbp != null ? totalPriceGbp : totalPrice;

  // Check for any stock issues across cart
  const stockIssues = items.filter((item) => {
    const stock = getStock(item);
    return isOOS(item) || (stock !== Infinity && item.quantity > stock);
  });

  if (items.length === 0) {
    return (
      <main className="bg-background min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-32 px-6 text-center">
          <p className="text-foreground font-serif text-2xl font-bold mb-4">Your cart is empty</p>
          <Link
            to="/shop"
            className="bg-primary text-primary-foreground font-serif font-bold text-sm px-8 py-3 rounded-full no-underline tracking-wider uppercase hover:scale-[1.02] transition-transform"
          >
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

        {/* Stock warning banner */}
        {stockIssues.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-sm font-bold text-amber-900 mb-1">
                {stockIssues.length === 1
                  ? "1 item has a stock issue:"
                  : `${stockIssues.length} items have stock issues:`}
              </p>
              {stockIssues.map((item) => {
                const stock = getStock(item);
                const oos = isOOS(item);
                return (
                  <p key={cartItemKey(item)} className="font-serif text-xs text-amber-800">
                    <strong>{item.name}</strong>{" "}
                    {item.style !== "tee" || item.size !== "One Size" ? `(${item.size}) ` : ""}
                    {oos
                      ? "— out of stock"
                      : `— only ${stock} available, you have ${item.quantity} in cart`}
                  </p>
                );
              })}
              <p className="font-serif text-xs text-amber-700 mt-1.5">
                Please reduce quantities or remove these items before checking out.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-8">
          {items.map((item) => {
            const key = cartItemKey(item);
            const colour = item.customisation?.Colour;
            const stock = getStock(item);
            const oos = isOOS(item);
            const exceedsStock = !oos && stock !== Infinity && item.quantity > stock;

            return (
              <div
                key={key}
                className={`flex gap-4 bg-card rounded-xl p-4 border ${
                  oos || exceedsStock ? "border-destructive/40 bg-destructive/5" : "border-border"
                }`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-secondary/40 flex items-center justify-center">
                    <span style={{ fontSize: "1.5rem" }}>🪡</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-serif font-bold text-sm">{item.name}</p>

                  {/* Style / size / colour */}
                  <p className="text-foreground/60 font-serif text-xs mt-0.5">
                    {item.style === "accessory"
                      ? `Variant: ${item.size}`
                      : `${item.style === "tee" ? "Tee" : "Tank"} · Size: ${item.size}`}
                    {colour && ` · ${colour}`}
                  </p>

                  {/* Customisation pills */}
                  {item.customisation && Object.keys(item.customisation).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
                      {Object.entries(item.customisation).map(([label, value]) => {
                        const isColorHex = /^#([0-9a-f]{3}){1,2}$/i.test(value);
                        return (
                          <span
                            key={label}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "2px 8px", borderRadius: "999px",
                              background: "rgba(139,26,47,0.07)",
                              border: "1px solid rgba(139,26,47,0.18)",
                              fontFamily: "Georgia, 'Times New Roman', serif",
                              fontSize: "10.5px", fontWeight: 600, color: "#8B1A2F",
                            }}
                          >
                            {isColorHex && (
                              <span style={{
                                width: 9, height: 9, borderRadius: "50%",
                                background: value,
                                border: "1px solid rgba(139,26,47,0.2)",
                                flexShrink: 0,
                              }} />
                            )}
                            <span style={{ opacity: 0.65 }}>{label}:</span> {value}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Stock warning inline */}
                  {oos && (
                    <p className="font-serif text-xs text-destructive font-bold mt-1">
                      Out of stock — remove to continue
                    </p>
                  )}
                  {!oos && exceedsStock && (
                    <p className="font-serif text-xs text-destructive font-bold mt-1">
                      Only {stock} available
                    </p>
                  )}

                  <p className="text-foreground font-serif font-bold text-sm mt-1.5">
                    {formatCartPrice(getItemDisplayPrice(item))}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.size, item.style, item.quantity - 1, key)
                      }
                      className="w-7 h-7 rounded-full border border-border bg-transparent text-foreground flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span
                      className={`font-serif text-sm font-bold w-5 text-center ${
                        exceedsStock ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (oos) {
                          toast.error("This item is out of stock");
                          return;
                        }
                        if (stock !== Infinity && item.quantity >= stock) {
                          toast.error(
                            stock === 0
                              ? "This item is out of stock"
                              : `Only ${stock} of this item available in stock`
                          );
                          return;
                        }
                        updateQuantity(item.productId, item.size, item.style, item.quantity + 1, key);
                      }}
                      className="w-7 h-7 rounded-full border border-border bg-transparent text-foreground flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId, item.size, item.style, key)}
                  className="bg-transparent border-none cursor-pointer text-destructive self-start p-1"
                >
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
            <span>{formatCartPrice(displayTotal)}</span>
          </div>
          <div className="flex justify-between font-serif text-lg font-black text-foreground">
            <span>Total</span>
            <span>{formatCartPrice(displayTotal)}</span>
          </div>
        </div>

        <Link
          to="/checkout"
          className="block w-full bg-primary text-primary-foreground text-center border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase no-underline mt-8 hover:scale-[1.02] transition-transform"
        >
          Proceed to Checkout
        </Link>
      </div>
      <Footer />
    </main>
  );
};

export default Cart;