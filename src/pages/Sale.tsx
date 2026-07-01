import { Link } from "react-router-dom";
import { useSaleProducts, useSiteSettings } from "@/hooks/useAdminData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRegion } from "@/context/RegionContext";

const isOutOfStock = (product: any) =>
  product.stock_status === "out_of_stock" || product.stock_status === "Out of Stock";

const calcDiscount = (item: any, region: string) => {
  if (region === "UK" && item.sale_price_gbp && item.products?.price_gbp) {
    return Math.round(((item.products.price_gbp - item.sale_price_gbp) / item.products.price_gbp) * 100);
  }
  return Math.round(((item.products.price - item.sale_price) / item.products.price) * 100);
};

const SaleCard = ({ item }: { item: any }) => {
  const product = item.products;
  const oos = isOutOfStock(product);
  const { formatPrice, region } = useRegion();
  const discount = calcDiscount(item, region);
  const href =
    product.category === "Accessories" || product.category === "Bagcharms"
      ? `/accessories/${product.id}`
      : `/product/${product.id}`;

  return (
    <Link to={href} className="no-underline">
      <div
        className="bg-card rounded-lg overflow-hidden cursor-pointer border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative"
        style={{ opacity: oos ? 0.85 : 1 }}
      >
        {/* Discount badge */}
        <div style={{
          position: "absolute", top: 8, right: 8, zIndex: 10,
          background: "hsl(var(--foreground))", color: "hsl(var(--background))",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 900, fontSize: "0.7rem", letterSpacing: "0.05em",
          padding: "4px 10px", borderRadius: "2rem",
        }}>
          -{discount}%
        </div>

        {oos && (
          <div style={{
            position: "absolute", top: 8, right: 8, zIndex: 10,
            background: "hsl(0 84.2% 60.2%)", color: "#fff",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 900, fontSize: "0.62rem", letterSpacing: "0.15em",
            textTransform: "uppercase", padding: "4px 10px", borderRadius: "2rem",
          }}>
            Out of Stock
          </div>
        )}

        <div className="bg-solea-warm flex items-center justify-center overflow-hidden" style={{ height: "340px" }}>
          <img
            src={product.image || product.images?.[0] || ""}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const p = (e.currentTarget as HTMLImageElement).parentElement;
              if (p) p.innerHTML = '<span style="font-size:2rem">🪡</span>';
            }}
          />
        </div>
        <div className="p-3">
          <p className="text-foreground font-serif font-bold text-base mb-0.5">{product.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p className="font-serif text-sm" style={{ textDecoration: "line-through", opacity: 0.5 }}>
              {formatPrice(product.price, product.price_gbp)}
            </p>
            <p className="text-foreground font-serif text-sm font-bold">
              {region === "UK"
                ? item.sale_price_gbp
                  ? `£${Number(item.sale_price_gbp).toLocaleString("en-GB")}`
                  : `£${Number(product.price_gbp ?? 0).toLocaleString("en-GB")}`
                : `Rs. ${Number(item.sale_price).toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Sale = () => {
  const { data: saleItems = [], isLoading } = useSaleProducts();
  const { data: settings = [] } = useSiteSettings();
  const isLive = (settings as any[]).find((s: any) => s.key === "sale_live")?.value === "true";
  const activeSaleItems = saleItems.filter((s: any) => s.products);

  // Sale is off — show a friendly message instead of products
  const showEmpty = !isLoading && (!isLive || activeSaleItems.length === 0);

  return (
    <main className="min-h-screen">
      <Navbar />

      <div style={{ textAlign: "center", padding: "40px 20px 20px" }}>
        <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, fontSize: "clamp(36px, 8vw, 64px)", color: "#dc2626", margin: 0, letterSpacing: "0.05em" }}>
          SALE
        </h1>
      </div>

      <div className="py-8 px-6 max-w-[1100px] mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden border border-border animate-pulse">
                <div className="h-[340px] bg-secondary/50" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-secondary/50 rounded w-3/4" />
                  <div className="h-3 bg-secondary/50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(18px, 4vw, 28px)", fontWeight: 700, color: "hsl(var(--foreground))", margin: "0 0 12px" }}>
              No items on sale right now
            </p>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(13px, 2.5vw, 16px)", color: "hsl(var(--muted-foreground))", margin: 0 }}>
              Stay tuned! Some special discounts are coming soon 🌸
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeSaleItems.map((item: any) => (
              <SaleCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
};

export default Sale;