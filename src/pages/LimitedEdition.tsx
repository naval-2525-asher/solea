import { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useAdminData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterSortBar, { ViewMode } from "@/components/FilterSortBar";
import { useFilterSort } from "@/hooks/useFilterSort";

const isOutOfStock = (product: any) =>
  product.stock_status === "out_of_stock" || product.stock_status === "Out of Stock";

const isLowStock = (product: any) => product.stock_status === "low_stock";

const getGridCols = (viewMode: ViewMode) => {
  if (viewMode === "double") return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
};

const ProductCard = ({ product, viewMode = "triple" }: { product: any; viewMode?: ViewMode }) => {
  const oos = isOutOfStock(product);
const imgHeight = viewMode === "double" ? "400px" : "340px";  return (
    <Link to={`/product/${product.id}`} className="no-underline">
      <div
        className="bg-card rounded-lg overflow-hidden cursor-pointer border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative"
        style={{ opacity: oos ? 0.85 : 1 }}
      >
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
          <img src={product.image} alt={product.name} className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const p = (e.currentTarget as HTMLImageElement).parentElement;
              if (p) p.innerHTML = '<span style="font-size:2rem">✦</span>';
            }} />
        </div>
        <div className="p-3">
          <p className="text-foreground font-serif font-bold text-sm mb-0.5">{product.name}</p>
          <p className="text-foreground font-serif font-bold text-xs">PKR {product.price?.toLocaleString()}</p>
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

const LimitedEdition = () => {
  const { data: dbProducts = [], isLoading } = useProducts();
  const limited = dbProducts.filter((p: any) => p.category === "Limited Edition");
  const [viewMode, setViewMode] = useState<ViewMode>("triple");

  const { sortBy, filters, sorted, filtered, maxPrice, hasFiltersApplied, setSortBy, setFilters } =
    useFilterSort(limited, true);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="py-8 px-8 text-center">
        <h1 className="text-foreground font-serif text-4xl font-black max-w-[300px] mx-auto">Limited Edition</h1>
        {!isLoading && limited.length === 0 && (
          <p className="text-foreground font-serif text-sm opacity-60 mt-2">Coming soon</p>
        )}
      </div>
      <div className="px-6 pb-16 max-w-[1100px] mx-auto">
        {!isLoading && limited.length > 0 && (
          <FilterSortBar
            products={limited}
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
            {[1, 2, 3].map((i) => (
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
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        ) : limited.length === 0 ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <p className="text-foreground font-serif text-base opacity-50">No products yet — stay tuned!</p>
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

export default LimitedEdition;
