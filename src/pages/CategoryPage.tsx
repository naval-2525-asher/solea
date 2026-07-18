import { useState, useEffect, useRef } from "react";
import { Link, useParams, Navigate, useLocation } from "react-router-dom";
import { useProducts, useSaleProducts, useCategories } from "@/hooks/useAdminData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterSortBar, { ViewMode } from "@/components/FilterSortBar";
import { useFilterSort } from "@/hooks/useFilterSort";
import { useRegion } from "@/context/RegionContext";

const isOutOfStock = (product: any) =>
  product.stock_status === "out_of_stock" || product.stock_status === "Out of Stock";
const isLowStock = (product: any) => product.stock_status === "low_stock";
const calcDiscount = (original: number, sale: number) => Math.round(((original - sale) / original) * 100);

// Same card used on Shop.tsx / Accessories.tsx — kept identical so new
// categories look native rather than bolted on.
const ProductCard = ({
  product, viewMode = "triple", salePrice, salePriceGbp, categoryType,
}: { product: any; viewMode?: ViewMode; salePrice?: number; salePriceGbp?: number; categoryType?: string }) => {
  const oos = isOutOfStock(product);
  const imgHeight = viewMode === "single" ? "600px" : viewMode === "double" ? "320px" : "280px";
  const discount = salePrice ? calcDiscount(product.price, salePrice) : null;
  const { formatPrice, region } = useRegion();
  const location = useLocation();
  // Accessory-type products (new or legacy) go to the proven AccessoryDetail
  // page, which already handles variant-only products correctly. Wearable
  // products go to the generic ProductDetail page (sizes, style toggle, etc).
  const href = categoryType === "accessory" || product.category === "Accessories" || product.category === "Bagcharms"
    ? `/accessories/${product.id}` : `/product/${product.id}`;


  return (
    <Link to={href} state={{ from: location.pathname }} className="no-underline">
      <div
        className="bg-card rounded-lg overflow-hidden cursor-pointer border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative"
        style={{ opacity: oos ? 0.85 : 1 }}
      >
        {discount && !oos && (
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, background: "hsl(var(--foreground))", color: "hsl(var(--background))", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "0.7rem", padding: "4px 10px", borderRadius: "2rem" }}>
            -{discount}%
          </div>
        )}
        {oos && (
          <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, background: "hsl(0 84.2% 60.2%)", color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "2rem" }}>
            Out of Stock
          </div>
        )}
        {!oos && isLowStock(product) && (
          <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, background: "#FEF08A", color: "#854D0E", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "11px", padding: "3px 10px", borderRadius: "999px", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            Few items left
          </div>
        )}
        <div className="bg-solea-warm flex items-center justify-center overflow-hidden" style={{ height: imgHeight, transition: "height 0.3s ease" }}>
          <img
            src={product.image || product.images?.[0] || ""}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = (e.currentTarget as HTMLImageElement).parentElement;
              if (parent) parent.innerHTML = '<span style="font-size:2rem">🪡</span>';
            }}
          />
        </div>
        <div className="p-3">
          <p className="text-foreground font-serif font-bold text-base mb-0.5">{product.name}</p>
          {salePrice ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p className="font-serif text-sm" style={{ textDecoration: "line-through", opacity: 0.5 }}>
                {formatPrice(product.price, product.price_gbp)}
              </p>
              <p className="text-foreground font-serif text-sm font-bold">
                {region === "UK"
                  ? `£${Number(salePriceGbp ?? product.price_gbp ?? 0).toLocaleString("en-GB")}`
                  : `Rs. ${Number(salePrice).toLocaleString()}`}
              </p>
            </div>
          ) : (
            <p className="text-foreground font-serif font-bold text-sm">
              {formatPrice(product.price, product.price_gbp)}
            </p>
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

const getGridStyle = (viewMode: ViewMode): React.CSSProperties => {
  if (viewMode === "single") return { display: "grid", gridTemplateColumns: "1fr", gap: "16px" };
  if (viewMode === "double") return { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" };
  return { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" };
};

// Generic listing page for any category created via Admin → Categories.
// Works the same regardless of category_type (Wearable vs Accessory) —
// product-level customization (sizes, variants, custom fields) is already
// driven by each product's own saved config, not by this page.
const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts();
  const { data: saleData = [] } = useSaleProducts();

  const category = (categories as any[]).find((c) => c.slug === slug);

  const initialViewMode = (): ViewMode =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "double" : "triple";
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const userChangedView = useRef(false);
  const handleViewModeChange = (mode: ViewMode) => { userChangedView.current = true; setViewMode(mode); };
  useEffect(() => {
    const update = () => { if (!userChangedView.current) setViewMode(window.innerWidth < 768 ? "double" : "triple"); };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const salePriceMap = Object.fromEntries(
    (saleData as any[]).map((s: any) => [s.product_id, { sale_price: s.sale_price, sale_price_gbp: s.sale_price_gbp }])
  );

  const categoryProducts = category
    ? (dbProducts as any[]).filter((p) => p.category === category.name)
    : [];

  const { sortBy, filters, sorted, filtered, maxPrice, hasFiltersApplied, setSortBy, setFilters } =
    useFilterSort(categoryProducts, category?.category_type === "wearable");

  const isLoading = categoriesLoading || productsLoading;

  if (!categoriesLoading && !category) {
    // Unknown slug, or the category was archived/never published — behave
    // like any other unmatched route.
    return <Navigate to="/" replace />;
  }
  if (!categoriesLoading && category && (category.status === "draft" || category.status === "archived")) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="py-8 px-8 text-center">
        <h1 className="text-foreground font-serif text-4xl font-black max-w-[400px] mx-auto">
          {category?.name || ""}
        </h1>
      </div>

      {category?.status === "coming_soon" ? (
        <div className="px-6 pb-24 max-w-[600px] mx-auto text-center">
          <div className="bg-secondary/40 border border-border rounded-2xl p-10">
            <p className="font-serif text-lg font-bold text-foreground mb-2">Coming Soon ✦</p>
            <p className="font-serif text-sm text-muted-foreground">
              This collection isn't quite ready yet — check back soon!
            </p>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-16 max-w-[1100px] mx-auto">
          {!isLoading && (
            <FilterSortBar
              products={categoryProducts}
              filteredCount={filtered.length}
              sortBy={sortBy}
              filters={filters}
              maxPrice={maxPrice}
              onSortChange={setSortBy}
              onFiltersApply={setFilters}
              hasFiltersApplied={hasFiltersApplied}
              showSizeFilter={category?.category_type === "wearable"}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          )}
          {isLoading ? (
            <div style={getGridStyle(viewMode)}>
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
            <div style={getGridStyle(viewMode)}>
              {sorted.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  salePrice={salePriceMap[product.id]?.sale_price}
                  salePriceGbp={salePriceMap[product.id]?.sale_price_gbp}
                  categoryType={category?.category_type}
                />
              ))}
            </div>
          ) : (
            <div style={{ minHeight: "30vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.9rem", color: "hsl(var(--muted-foreground))" }}>
                {categoryProducts.length === 0 ? "No products in this collection yet." : "No products match your filters."}
              </p>
            </div>
          )}
        </div>
      )}
      <Footer />
    </main>
  );
};

export default CategoryPage;
