import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts, useNewArrivals, useSaleProducts } from "@/hooks/useAdminData";
import { products as staticProducts } from "@/lib/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterSortBar, { ViewMode } from "@/components/FilterSortBar";
import { useFilterSort } from "@/hooks/useFilterSort";

const isOutOfStock = (product: any) =>
  product.stock_status === "out_of_stock" || product.stock_status === "Out of Stock";

const isLowStock = (product: any) => product.stock_status === "low_stock";

const calcDiscount = (original: number, sale: number) =>
  Math.round(((original - sale) / original) * 100);

const ProductCard = ({ product, showNewBadge = false, viewMode = "triple", salePrice }: { product: any; showNewBadge?: boolean; viewMode?: ViewMode; salePrice?: number }) => {
  const oos = isOutOfStock(product);
  const imgHeight = viewMode === "single" ? "480px" : viewMode === "double" ? "400px" : "340px";
  const discount = salePrice ? calcDiscount(product.price, salePrice) : null;
  return (
    <Link to={`/product/${product.id}`} className="no-underline">
      <div className="bg-card rounded-lg overflow-hidden cursor-pointer border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative" style={{ opacity: oos ? 0.85 : 1 }}>
        {discount && !oos && (
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, background: "hsl(var(--foreground))", color: "hsl(var(--background))", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "0.7rem", padding: "4px 10px", borderRadius: "2rem" }}>
            -{discount}%
          </div>
        )}
        {showNewBadge && !oos && !discount && (
          <div className="absolute top-2 left-2 z-10 bg-destructive text-white font-serif font-black text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full">NEW</div>
        )}
        {oos && (
          <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, background: "hsl(0 84.2% 60.2%)", color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "2rem" }}>
            Out of Stock
          </div>
        )}
        {!oos && isLowStock(product) && (
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, background: "#FEF08A", color: "#854D0E", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "11px", padding: "3px 10px", borderRadius: "999px", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            Few items left
          </div>
        )}
        <div className="bg-solea-warm flex items-center justify-center overflow-hidden" style={{ height: imgHeight, transition: "height 0.3s ease" }}>
          <img src={product.image || product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = (e.currentTarget as HTMLImageElement).parentElement;
              if (parent) parent.innerHTML = '<span style="font-size:2rem">🪡</span>';
            }} />
        </div>
        <div className="p-3">
          <p className="text-foreground font-serif font-bold text-sm mb-0.5">{product.name}</p>
          {salePrice ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p className="font-serif text-xs" style={{ textDecoration: "line-through", opacity: 0.5 }}>PKR {product.price?.toLocaleString()}</p>
              <p className="text-foreground font-serif text-xs font-bold">PKR {Number(salePrice).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-foreground font-serif font-bold text-xs">PKR {product.price?.toLocaleString()}</p>
          )}
          {oos && (
            <button disabled style={{ marginTop: "0.5rem", width: "100%", background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", border: "none", borderRadius: "2rem", padding: "6px 0", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "not-allowed", opacity: 0.7 }}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

const getGridCols = (viewMode: ViewMode) => {
  if (viewMode === "single") return "grid-cols-1";
  if (viewMode === "double") return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
};

const Shop = () => {
  const { data: dbProducts = [], isLoading } = useProducts();
  const { data: newArrivalsData = [] } = useNewArrivals();
  const { data: saleData = [] } = useSaleProducts();

  // Default: 2 cols on mobile, 3 cols on desktop
  const [viewMode, setViewMode] = useState<ViewMode>("triple");

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768) {
        setViewMode("double");
      } else {
        setViewMode("triple");
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const salePriceMap = Object.fromEntries(
    (saleData as any[]).map((s: any) => [s.product_id, s.sale_price])
  );

  const newArrivalProducts = (newArrivalsData as any[]).filter((a) => a.products).map((a) => a.products);
  const newArrivalIds = new Set(newArrivalProducts.map((p: any) => p.id));

  const allProducts = dbProducts.length > 0
    ? dbProducts.filter((p: any) => p.category === "Tees & Tank Tops")
    : staticProducts.filter((p) => p.category === "beaded tee" || p.category === "beaded tank");

  const regularProducts = allProducts.filter((p: any) => !newArrivalIds.has(p.id));

  const { sortBy, filters, sorted, filtered, maxPrice, hasFiltersApplied, setSortBy, setFilters } =
    useFilterSort(regularProducts, true);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="py-8 px-8 text-center">
        <h1 className="text-foreground font-serif text-4xl font-black max-w-[300px] mx-auto">Tanks & Tees</h1>
      </div>

      {newArrivalProducts.length > 0 && (
        <div className="px-6 pb-4 max-w-[1100px] mx-auto">
          <div className="mb-4">
            <h2 className="text-foreground font-serif text-2xl font-black">New Arrivals</h2>
            <p className="text-foreground/60 font-serif text-xs tracking-wide mt-0.5">fresh off the needle ✦</p>
          </div>
          <div className={`grid ${getGridCols(viewMode)} gap-4`}>
            {newArrivalProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} showNewBadge viewMode={viewMode} />
            ))}
          </div>
          <div className="border-t border-border/40 mt-8" />
        </div>
      )}

      <div className="py-6 px-8 text-center">
        <h2 className="text-foreground font-serif text-4xl font-black max-w-[300px] mx-auto">Shop All</h2>
      </div>

      <div className="px-6 pb-16 max-w-[1100px] mx-auto">
        {!isLoading && (
          <FilterSortBar
            products={regularProducts}
            filteredCount={filtered.length}
            sortBy={sortBy}
            filters={filters}
            maxPrice={maxPrice}
            onSortChange={setSortBy}
            onFiltersApply={setFilters}
            hasFiltersApplied={hasFiltersApplied}
            showSizeFilter={true}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}
        {isLoading ? (
          <div className={`grid ${getGridCols(viewMode)} gap-4`}>
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
        ) : sorted.length > 0 ? (
          <div className={`grid ${getGridCols(viewMode)} gap-4`}>
            {sorted.map((product: any) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} salePrice={salePriceMap[product.id]} />
            ))}
          </div>
        ) : (
          <div style={{ minHeight: "30vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.9rem", color: "hsl(var(--muted-foreground))" }}>
              No products match your filters.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
};

export default Shop;