import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, ArrowRight, ChevronRight, ShoppingBag, ChevronDown } from "lucide-react";
import { products as staticProducts } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, useProducts, useSaleProducts, useCategories, useActiveCategoryNames } from "@/hooks/useAdminData";
import { getShowNewBadge } from "@/pages/admin/AdminCategories";
import { useRegion, REGIONS, Region } from "@/context/RegionContext";

// ── Announcement Bar ──────────────────────────────────────────────────────────
const AnnouncementBar = () => {
  const { data: settings = [] } = useSiteSettings();
  const { region } = useRegion();
  const isUK = region === "UK";
  const text = isUK
    ? settings.find((s: any) => s.key === "announcement_text_uk")?.value || "Free delivery on orders over £80 ✦ Shipping may take up to 4 weeks"
    : settings.find((s: any) => s.key === "announcement_text_pk")?.value || "Shipping may take up to 4 weeks ✦ Free delivery on orders over PKR 10,000";
  const chunk = `${text}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0✦\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`;
  const repeated = Array(15).fill(chunk).join("");
  return (
    <div className="w-full bg-primary text-primary-foreground py-2 z-[200]" style={{ overflow: "hidden", position: "relative" }}>
      <div style={{ display: "inline-flex", flexShrink: 0, whiteSpace: "nowrap", animation: "marquee 150s linear infinite", willChange: "transform" }}>
        <span style={{ display: "inline-block", flexShrink: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "10px", fontWeight: "bold", letterSpacing: "0.15em" }}>{repeated}</span>
        <span aria-hidden="true" style={{ display: "inline-block", flexShrink: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "10px", fontWeight: "bold", letterSpacing: "0.15em" }}>{repeated}</span>
      </div>
    </div>
  );
};

// ── Flag ──────────────────────────────────────────────────────────────────────
const FlagImg = ({ code, size = 20 }: { code: string; size?: number }) => {
  const iso = code === "UK" ? "gb" : code.toLowerCase();
  return <img src={`https://flagcdn.com/w40/${iso}.png`} width={size} height={size * 0.67} alt={code} style={{ borderRadius: 3, objectFit: "cover", display: "inline-block", flexShrink: 0 }} />;
};

// ── Region Selector ───────────────────────────────────────────────────────────
const RegionSelector: React.FC = () => {
  const { region, setRegion, regionConfig } = useRegion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((p) => !p)} className="flex items-center gap-1.5 bg-white/40 backdrop-blur-sm border-none cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-white/60 transition-colors font-serif text-xs text-foreground font-bold" aria-label="Select region">
        <FlagImg code={regionConfig.code} size={20} />
        <span className="hidden sm:inline">{regionConfig.currency}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[700] min-w-[180px]">
          {(Object.values(REGIONS) as typeof REGIONS[Region][]).map((r) => (
            <button key={r.code} onClick={() => { setRegion(r.code); setOpen(false); }} className={`w-full flex items-center gap-2.5 px-4 py-3 font-serif text-sm text-left transition-colors border-none cursor-pointer ${region === r.code ? "bg-primary/10 text-primary font-bold" : "bg-transparent text-foreground hover:bg-secondary/60"}`}>
              <FlagImg code={r.code} size={22} />
              <span className="flex-1">{r.label}</span>
              <span className="text-xs text-foreground/50">{r.currency}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Nav links ─────────────────────────────────────────────────────────────────
// Category links (Tees & Tanks, Accessories, Limited Edition, Bagcharms, and
// any new categories) are injected dynamically at render time from the
// categories table — see NAV_LINKS_BEFORE_CATEGORIES / _AFTER below.
const NAV_LINKS_BEFORE_CATEGORIES = [
  { to: "/",     label: "Home",     sale: false },
  { to: "/sale", label: "SALE 🏷️",  sale: true  },
];
const NAV_LINKS_AFTER_CATEGORIES = [
  { to: "/faq",     label: "FAQ",         sale: false },
  { to: "/contact", label: "Contact Us",  sale: false },
];

// ── Slide Panel (reusable) ────────────────────────────────────────────────────
// Always rendered in the DOM, slides in/out via CSS transform.
// This avoids the unmount/remount bug entirely.
const SlidePanel = ({
  open, onClose, side, children, bgColor,
}: {
  open: boolean; onClose: () => void; side: "left" | "right";
  children: React.ReactNode; bgColor: string;
}) => {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 800,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          [side]: 0,
          height: "100%",
          width: "clamp(260px, 75vw, 320px)",
          background: bgColor,
          boxShadow: side === "left" ? "4px 0 32px rgba(0,0,0,0.12)" : "-4px 0 32px rgba(0,0,0,0.1)",
          transform: open
            ? "translateX(0)"
            : side === "left" ? "translateX(-100%)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// ── Search helpers ────────────────────────────────────────────────────────────
// A product is "on sale" for search purposes when: the global sale toggle is
// live, AND the product has an entry in the sale_products table with a price
// for the shopper's current region.
const isAccessoryCategory = (category: string, categoryTypeMap: Record<string, string>) =>
  category === "Accessories" || category === "Bagcharms" || categoryTypeMap[category] === "accessory";

const getSearchHref = (product: any, categoryTypeMap: Record<string, string>) =>
  isAccessoryCategory(product.category, categoryTypeMap) ? `/accessories/${product.id}` : `/product/${product.id}`;

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { formatPrice, region } = useRegion();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Live product catalogue (falls back to the static list if the DB hasn't
  // loaded yet / is empty) so search always reflects the latest admin edits.
  const { data: dbProducts = [] } = useProducts();
  const { data: saleData = [] } = useSaleProducts();
  const { data: settings = [] } = useSiteSettings();
  const { data: dbCategories = [] } = useCategories();

  const saleIsLive = (settings as any[]).find((s: any) => s.key === "sale_live")?.value === "true";

  // Category entries in the burger menu — live + coming soon, ordered by
  // menu_order (falls back to display_order). Draft/Archived never show.
  const categoryLinks = (dbCategories as any[])
    .filter((cat) => cat.status === "live" || cat.status === "coming_soon")
    .sort((a, b) => (a.menu_order ?? a.display_order ?? 0) - (b.menu_order ?? b.display_order ?? 0))
    .map((cat) => ({
      to: cat.is_legacy ? cat.legacy_href : `/category/${cat.slug}`,
      label: cat.name,
      sale: false,
      comingSoon: cat.status === "coming_soon",
      isNew: getShowNewBadge(cat),
    }));
  const NAV_LINKS = [...NAV_LINKS_BEFORE_CATEGORIES, ...categoryLinks, ...NAV_LINKS_AFTER_CATEGORIES];

  // Used to route search results for any accessory-type category (new or
  // built-in) to the AccessoryDetail page instead of the generic one.
  const categoryTypeMap: Record<string, string> = Object.fromEntries(
    (dbCategories as any[]).map((c: any) => [c.name, c.category_type])
  );

  const salePriceMap = useMemo(() => {
    const map: Record<string, { sale_price: number; sale_price_gbp: number | null }> = {};
    (saleData as any[]).forEach((s: any) => {
      map[s.product_id] = { sale_price: s.sale_price, sale_price_gbp: s.sale_price_gbp };
    });
    return map;
  }, [saleData]);

  const activeCategoryNames = useActiveCategoryNames();
  const allProducts = (dbProducts.length > 0 ? dbProducts : staticProducts)
    .filter((p: any) => activeCategoryNames.has(p.category));

  // Close both on route change
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const closeMenu   = () => setMenuOpen(false);
  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); };

  const filteredProducts = searchQuery.trim()
    ? (allProducts as any[]).filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Renders the current price for a search result: the live sale price (if
  // the sale is on and this product is part of it) with the original price
  // struck through, otherwise just the regular price — in the shopper's region.
  const renderSearchPrice = (product: any) => {
    const sale = salePriceMap[product.id];
    const onSale = saleIsLive && !!sale;

    if (!onSale) {
      return (
        <p style={{ fontFamily: "Georgia, serif", fontSize: "12px", opacity: 0.5, margin: "2px 0 0" }}>
          {formatPrice(product.price, product.price_gbp)}
        </p>
      );
    }

    const salePriceDisplay =
      region === "UK"
        ? `£${Number(sale.sale_price_gbp ?? product.price_gbp ?? 0).toLocaleString("en-GB")}`
        : `Rs. ${Number(sale.sale_price).toLocaleString()}`;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "2px" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: "11px", opacity: 0.45, textDecoration: "line-through", margin: 0 }}>
          {formatPrice(product.price, product.price_gbp)}
        </p>
        <p style={{ fontFamily: "Georgia, serif", fontSize: "12px", fontWeight: 700, color: "#dc2626", margin: 0 }}>
          {salePriceDisplay}
        </p>
      </div>
    );
  };

  return (
    <>
      <AnnouncementBar />

      {/* ── Burger Menu ── */}
      <SlidePanel open={menuOpen} onClose={closeMenu} side="left" bgColor="hsl(var(--solea-pink))">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid hsl(var(--foreground) / 0.12)" }}>
          <Link to="/" onClick={closeMenu} style={{ textDecoration: "none" }}>
            <p style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "26px", color: "hsl(var(--foreground))", margin: 0, lineHeight: 1 }}>soléa</p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "9px", letterSpacing: "0.28em", color: "hsl(var(--foreground))", margin: "4px 0 0", opacity: 0.7 }}>Art You Can Wear</p>
          </Link>
          <button onClick={closeMenu} style={{ background: "rgba(255,255,255,0.35)", border: "none", borderRadius: "10px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "hsl(var(--foreground))", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Links */}
        <nav style={{ padding: "12px", flex: 1 }}>
          {NAV_LINKS.map((link: any) => {
            const content = (
              <>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {link.label}
                  {link.isNew && (
                    <span style={{ background: "hsl(var(--destructive))", color: "#fff", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "9px", letterSpacing: "0.1em", padding: "2px 7px", borderRadius: "999px" }}>NEW</span>
                  )}
                  {link.comingSoon && (
                    <span style={{ background: "hsl(var(--foreground) / 0.15)", color: "hsl(var(--foreground))", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "9px", letterSpacing: "0.08em", padding: "2px 7px", borderRadius: "999px" }}>COMING SOON</span>
                  )}
                </span>
                {!link.comingSoon && <ChevronRight size={15} style={{ opacity: 0.45 }} />}
              </>
            );
            const sharedStyle: React.CSSProperties = {
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 14px", borderRadius: "12px", textDecoration: "none",
              fontFamily: "Georgia, serif", fontSize: "14px",
              fontWeight: link.sale ? 900 : 400,
              color: link.sale ? "#dc2626" : "hsl(var(--foreground))",
              opacity: link.comingSoon ? 0.6 : 1,
              transition: "background 0.18s",
            };
            if (link.comingSoon) {
              // Matches the home page: Coming Soon items are informational
              // only, not clickable, until the category is launched.
              return <div key={link.to} style={sharedStyle}>{content}</div>;
            }
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                style={sharedStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = link.sale ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.28)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "14px 20px", borderTop: "1px solid hsl(var(--foreground) / 0.1)", fontFamily: "Georgia, serif", fontSize: "11px", letterSpacing: "0.1em", opacity: 0.5, color: "hsl(var(--foreground))" }}>
          © 2025 soléa
        </div>
      </SlidePanel>

      {/* ── Search Panel ── */}
      <SlidePanel open={searchOpen} onClose={closeSearch} side="right" bgColor="hsl(var(--background))">
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "18px", color: "hsl(var(--foreground))", margin: 0 }}>Search</p>
          <button onClick={closeSearch} style={{ background: "hsl(var(--secondary))", border: "none", borderRadius: "10px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "hsl(var(--foreground))", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Input */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid hsl(var(--border))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "hsl(var(--secondary))", borderRadius: "14px", padding: "10px 14px" }}>
            <Search size={15} style={{ color: "hsl(var(--foreground))", opacity: 0.45, flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "Georgia, serif", fontSize: "14px", color: "hsl(var(--foreground))" }}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeSearch();
                if (e.key === "Enter" && filteredProducts.length === 1) {
                  navigate(getSearchHref(filteredProducts[0], categoryTypeMap), { state: { from: location.pathname } });
                  closeSearch();
                }
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "hsl(var(--foreground))", opacity: 0.4, display: "flex", alignItems: "center" }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
          {!searchQuery.trim() && (
            <p style={{ fontFamily: "Georgia, serif", fontSize: "12px", opacity: 0.4, padding: "16px 8px", letterSpacing: "0.08em" }}>Start typing to search…</p>
          )}
          {searchQuery.trim() !== "" && filteredProducts.length === 0 && (
            <p style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: "hsl(var(--destructive))", padding: "14px 8px" }}>No results for "{searchQuery}"</p>
          )}
          {filteredProducts.map((product: any) => (
            <Link
              key={product.id}
              to={getSearchHref(product, categoryTypeMap)}
              state={{ from: location.pathname }}
              onClick={closeSearch}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "12px", textDecoration: "none", color: "hsl(var(--foreground))", transition: "background 0.15s", marginBottom: "2px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--secondary))")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <img src={product.image || product.images?.[0] || ""} alt={product.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "hsl(var(--secondary))" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</p>
                {renderSearchPrice(product)}
              </div>
              <ArrowRight size={14} style={{ opacity: 0.3, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </SlidePanel>

      {/* ── Main Navbar ── */}
      <nav
        className="sticky top-0 z-[500] flex justify-between items-center px-6 pt-3 pb-3 border-b-2 border-solea-rose/30"
        style={{ background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 40px, hsl(var(--solea-beige)) 40px, hsl(var(--solea-beige)) 80px)" }}
      >
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(true)} className="bg-white/40 backdrop-blur-sm border-none cursor-pointer p-2 text-foreground rounded-lg hover:bg-white/60 transition-colors" aria-label="Open menu">
            <Menu size={24} />
          </button>
          <RegionSelector />
        </div>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2 no-underline text-center">
          <p className="text-foreground font-serif font-black text-4xl m-0 mt-2 cursor-pointer leading-none">soléa</p>
          <p className="text-foreground font-serif text-[10px] tracking-[0.3em] m-0 mt-1.5">Art &nbsp;You &nbsp;Can &nbsp;Wear</p>
        </Link>

        <div className="flex gap-2 items-center">
          <button onClick={() => setSearchOpen((p) => !p)} className="bg-white/40 backdrop-blur-sm border-none cursor-pointer p-2 text-foreground rounded-lg hover:bg-white/60 transition-colors" aria-label="Search">
            <Search size={22} />
          </button>
          <Link to="/cart" className="relative bg-white/40 backdrop-blur-sm p-2 text-foreground rounded-lg hover:bg-white/60 transition-colors">
            <ShoppingBag size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center font-serif">{totalItems}</span>
            )}
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
