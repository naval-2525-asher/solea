import { useState, useRef, useEffect } from "react";

import { SlidersHorizontal, ChevronUp, X } from "lucide-react";



export type SortOption =

  | "featured" | "best_selling" | "alpha_asc" | "alpha_desc"

  | "price_asc" | "price_desc" | "date_asc" | "date_desc";



export type AvailabilityFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";



export type ViewMode = "single" | "double" | "triple";



export interface FilterState {

  availability: AvailabilityFilter;

  priceMin: number;

  priceMax: number;

  sizes: string[];

}



interface FilterSortBarProps {

  products: any[];

  filteredCount: number;

  sortBy: SortOption;

  filters: FilterState;

  maxPrice: number;

  onSortChange: (sort: SortOption) => void;

  onFiltersApply: (filters: FilterState) => void;

  hasFiltersApplied: boolean;

  showSizeFilter?: boolean;

  viewMode?: ViewMode;

  onViewModeChange?: (mode: ViewMode) => void;

}



const SingleViewIcon = () => (

  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">

    <rect x="2" y="2" width="12" height="12" rx="1.5" fill="currentColor"/>

  </svg>

);

const DoubleViewIcon = () => (

  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">

    <rect x="1" y="2" width="6" height="12" rx="1.5" fill="currentColor"/>

    <rect x="9" y="2" width="6" height="12" rx="1.5" fill="currentColor"/>

  </svg>

);

const TripleViewIcon = () => (

  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">

    <rect x="1" y="2" width="4" height="12" rx="1" fill="currentColor"/>

    <rect x="6" y="2" width="4" height="12" rx="1" fill="currentColor"/>

    <rect x="11" y="2" width="4" height="12" rx="1" fill="currentColor"/>

  </svg>

);



const SORT_LABELS: Record<SortOption, string> = {

  featured: "Featured",

  best_selling: "Best selling",

  alpha_asc: "Alphabetically, A–Z",

  alpha_desc: "Alphabetically, Z–A",

  price_asc: "Price, low to high",

  price_desc: "Price, high to low",

  date_asc: "Date, old to new",

  date_desc: "Date, new to old",

};



const SIZES = ["S", "M", "L", "XL"];



const CB = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (

  <label style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", color: "hsl(var(--foreground))", userSelect: "none" }}>

    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}

      style={{ width: 16, height: 16, accentColor: "hsl(var(--primary))", cursor: "pointer" }} />

    {label}

  </label>

);



export default function FilterSortBar({

  filteredCount, sortBy, filters, maxPrice,

  onSortChange, onFiltersApply, hasFiltersApplied,

  showSizeFilter = true, viewMode = "triple", onViewModeChange,

}: FilterSortBarProps) {

  const [sortOpen, setSortOpen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);

  const [draft, setDraft] = useState<FilterState>(filters);

  const [isMobile, setIsMobile] = useState(false);



  useEffect(() => {

    const update = () => setIsMobile(window.innerWidth < 768);

    update();

    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);

  }, []);



  useEffect(() => { if (filterOpen) setDraft(filters); }, [filterOpen]);



  const sortRef = useRef<HTMLDivElement>(null);

  const filterRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    const handler = (e: MouseEvent) => {

      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);

      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);

    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);

  }, []);



  const toggleSize = (size: string) =>

    setDraft((d) => ({ ...d, sizes: d.sizes.includes(size) ? d.sizes.filter((s) => s !== size) : [...d.sizes, size] }));



  const applyFilters = () => { onFiltersApply(draft); setFilterOpen(false); };



  const clearFilters = () => {

    const cleared: FilterState = { availability: "all", priceMin: 0, priceMax: maxPrice, sizes: [] };

    setDraft(cleared);

    onFiltersApply(cleared);

  };



  const safeMax = maxPrice > 0 ? maxPrice : 20000;



  // Mobile: single & double. Desktop: double & triple.

  const viewOptions = isMobile

    ? [

        { mode: "double" as ViewMode, Icon: DoubleViewIcon, label: "Two columns" },

        { mode: "single" as ViewMode, Icon: SingleViewIcon, label: "One column" },

      ]

    : [

        { mode: "triple" as ViewMode, Icon: TripleViewIcon, label: "Three columns" },

        { mode: "double" as ViewMode, Icon: DoubleViewIcon, label: "Two columns" },

      ];



  return (

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 1.25rem 0", borderBottom: "1px solid hsl(var(--border))", marginBottom: "1.5rem", fontFamily: "Georgia, 'Times New Roman', serif", position: "relative", zIndex: 50 }}>



      {/* FILTERS */}

      <div ref={filterRef} style={{ position: "relative" }}>

        <button onClick={() => setFilterOpen((o) => !o)}

          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "transparent", border: "1.5px solid hsl(var(--border))", borderRadius: "2rem", padding: "0.45rem 1.1rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>

          <SlidersHorizontal size={13} />

          Filters

          {hasFiltersApplied && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "hsl(var(--destructive))", display: "inline-block", marginLeft: 2 }} />}

        </button>



        {filterOpen && (

          <div style={{ position: "absolute", top: "calc(100% + 10px)", left: 0, width: 310, background: "hsl(var(--background))", border: "1.5px solid hsl(var(--border))", borderRadius: "1.25rem", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", zIndex: 100, overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem 0.75rem", borderBottom: "1px solid hsl(var(--border))" }}>

              <span style={{ fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>Filters</span>

              <button onClick={() => setFilterOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--foreground))", padding: 2 }}><X size={16} /></button>

            </div>

            <div style={{ padding: "0 1.25rem" }}>

              <div style={{ borderBottom: "1px solid hsl(var(--border))", padding: "1rem 0" }}>

                <p style={{ fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "hsl(var(--foreground))", marginBottom: "0.75rem" }}>Availability</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>

                  <CB checked={draft.availability === "in_stock"} onChange={(v) => setDraft((d) => ({ ...d, availability: v ? "in_stock" : "all" }))} label="In stock" />

                  <CB checked={draft.availability === "low_stock"} onChange={(v) => setDraft((d) => ({ ...d, availability: v ? "low_stock" : "all" }))} label="Low Stock" />

                  <CB checked={draft.availability === "out_of_stock"} onChange={(v) => setDraft((d) => ({ ...d, availability: v ? "out_of_stock" : "all" }))} label="Out of stock" />

                </div>

              </div>

              <div style={{ borderBottom: showSizeFilter ? "1px solid hsl(var(--border))" : "none", padding: "1rem 0" }}>

                <p style={{ fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "hsl(var(--foreground))", marginBottom: "1rem" }}>Price</p>

                <div style={{ position: "relative", height: 28, marginBottom: "0.9rem" }}>

                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 4, background: "hsl(var(--border))", borderRadius: 2, transform: "translateY(-50%)" }} />

                  <div style={{ position: "absolute", top: "50%", height: 4, background: "hsl(var(--primary))", borderRadius: 2, transform: "translateY(-50%)", left: `${(draft.priceMin / safeMax) * 100}%`, right: `${100 - (draft.priceMax / safeMax) * 100}%` }} />

                  <input type="range" min={0} max={safeMax} step={100} value={draft.priceMin}

                    onChange={(e) => setDraft((d) => ({ ...d, priceMin: Math.min(Number(e.target.value), d.priceMax) }))}

                    style={{ position: "absolute", width: "100%", top: 0, height: "100%", opacity: 0, cursor: "pointer", zIndex: 2 }} />

                  <input type="range" min={0} max={safeMax} step={100} value={draft.priceMax}

                    onChange={(e) => setDraft((d) => ({ ...d, priceMax: Math.max(Number(e.target.value), d.priceMin) }))}

                    style={{ position: "absolute", width: "100%", top: 0, height: "100%", opacity: 0, cursor: "pointer", zIndex: 3 }} />

                  <div style={{ position: "absolute", top: "50%", left: `calc(${(draft.priceMin / safeMax) * 100}% - 9px)`, transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", background: "hsl(var(--foreground))", zIndex: 1, pointerEvents: "none" }} />

                  <div style={{ position: "absolute", top: "50%", left: `calc(${(draft.priceMax / safeMax) * 100}% - 9px)`, transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", background: "hsl(var(--foreground))", zIndex: 1, pointerEvents: "none" }} />

                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>

                  {[["priceMin", draft.priceMin], ["priceMax", draft.priceMax]].map(([key, val], i) => (

                    <>

                      {i === 1 && <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.8rem" }}>—</span>}

                      <div key={String(key)} style={{ flex: 1, border: "1.5px solid hsl(var(--border))", borderRadius: "0.5rem", padding: "0.35rem 0.6rem", display: "flex", alignItems: "center", gap: 4 }}>

                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Rs</span>

                        <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{Number(val).toLocaleString()}</span>

                      </div>

                    </>

                  ))}

                </div>

              </div>

              {showSizeFilter && (

                <div style={{ padding: "1rem 0" }}>

                  <p style={{ fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "hsl(var(--foreground))", marginBottom: "0.75rem" }}>Size</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>

                    {SIZES.map((size) => (

                      <CB key={size} checked={draft.sizes.includes(size)} onChange={() => toggleSize(size)} label={size} />

                    ))}

                  </div>

                </div>

              )}

            </div>

            <div style={{ padding: "0.75rem 1.25rem 1.25rem", borderTop: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column", gap: "0.5rem" }}>

              <button onClick={applyFilters} style={{ width: "100%", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "2rem", padding: "0.75rem", fontFamily: "inherit", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>

                View {filteredCount} Items

              </button>

              {hasFiltersApplied && (

                <button onClick={clearFilters} style={{ width: "100%", background: "transparent", color: "hsl(var(--muted-foreground))", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", textDecoration: "underline" }}>

                  Clear all

                </button>

              )}

            </div>

          </div>

        )}

      </div>



      {/* VIEW MODE SWITCHER */}

      {onViewModeChange && (

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>

          {viewOptions.map(({ mode, Icon, label }) => (

            <button key={mode} onClick={() => onViewModeChange(mode)} title={label}

              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "0.6rem",

                border: viewMode === mode ? "1.5px solid hsl(var(--foreground))" : "1.5px solid hsl(var(--border))",

                background: viewMode === mode ? "hsl(var(--foreground))" : "transparent",

                color: viewMode === mode ? "hsl(var(--background))" : "hsl(var(--foreground)/0.5)",

                cursor: "pointer", transition: "all 0.18s ease" }}>

              <Icon />

            </button>

          ))}

        </div>

      )}



      {/* SORT BY */}

      <div ref={sortRef} style={{ position: "relative" }}>

        <button onClick={() => setSortOpen((o) => !o)}

          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>

          Sort By

          <ChevronUp size={13} style={{ transition: "transform 0.2s", transform: sortOpen ? "rotate(0deg)" : "rotate(180deg)" }} />

        </button>

        {sortOpen && (

          <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 230, background: "hsl(var(--background))", border: "1.5px solid hsl(var(--border))", borderRadius: "1.25rem", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 100 }}>

            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (

              <button key={key} onClick={() => { onSortChange(key); setSortOpen(false); }}

                style={{ display: "block", width: "100%", textAlign: "left", background: sortBy === key ? "hsl(var(--secondary))" : "transparent", border: "none", padding: "0.7rem 1.25rem", fontFamily: "inherit", fontWeight: sortBy === key ? 800 : 600, fontSize: "0.82rem", color: "hsl(var(--foreground))", cursor: "pointer" }}>

                {label}

              </button>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}