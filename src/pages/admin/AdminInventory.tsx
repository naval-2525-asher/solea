import { useState, useEffect, useRef } from "react";
import { useProducts } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, AlertTriangle, CheckCircle, XCircle, ChevronDown, AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { TEE_SIZES, TANK_SIZES, LOW_STOCK_THRESHOLD, parseStockMap, recomputeTotals } from "@/lib/inventory";

const stockStatusInfo = (status: string, count: number) => {
  if (status === "out_of_stock" || count === 0)
    return { label: "Out of Stock", color: "#dc2626", bg: "#fee2e2", icon: XCircle };
  if (status === "low_stock" || count <= LOW_STOCK_THRESHOLD)
    return { label: "Low Stock",    color: "#d97706", bg: "#fef3c7", icon: AlertTriangle };
  return   { label: "In Stock",     color: "#16a34a", bg: "#dcfce7", icon: CheckCircle };
};

const autoStatus = (count: number) =>
  count === 0 ? "out_of_stock" : count <= LOW_STOCK_THRESHOLD ? "low_stock" : "in_stock";

// A product can be tee, tank, or both
const getTypes = (product: any): { isTee: boolean; isTank: boolean } => {
  const avAs: string[] = product.available_as || [];
  const tags: string[] = product.product_tags || [];
  const combined = [...avAs, ...tags];

  // If available_as is explicitly set, trust it completely
  if (avAs.length > 0) {
    return {
      isTee:  avAs.includes("tee"),
      isTank: avAs.includes("tank"),
    };
  }
  // Fall back to tags
  const isTank = tags.includes("tank");
  const isTee  = tags.includes("tee") || combined.length === 0; // default to tee only if completely untagged
  return { isTee, isTank };
};

// Extract colour/style options from variants JSON
const getColorsFromVariants = (product: any): string[] => {
  const variants: any[] = Array.isArray(product.variants) ? product.variants : [];
  return variants
    .filter((v: any) =>
      ["color", "colour", "style"].includes((v.label || "").toLowerCase())
    )
    .map((v: any) => v.name)
    .filter(Boolean);
};

// Get the admin-chosen color names for a given style from the new tee_colors / tank_colors fields
const getStyleColors = (product: any, style: "tee" | "tank"): string[] => {
  const field = style === "tee" ? "tee_colors" : "tank_colors";
  const arr = product[field];
  return Array.isArray(arr) ? arr : [];
};

const PRESET_COLOR_HEX: Record<string, string> = {
  Black: "#000000", White: "#FFFFFF", Red: "#DC2626",
  Pink: "#F9A8D4", Yellow: "#FDE047", Blue: "#3B82F6",
  Green: "#22C55E", Purple: "#A855F7", Other: "#D4A574",
};

// Tee and Tank stock are tracked as two completely separate pools per size —
// "Tee S" and "Tank S" must never share a number.
type EditRow = {
  stock_count:      number;
  tee_stock:        Record<string, number>;
  tank_stock:       Record<string, number>;
  color_stock:      Record<string, number>;
  tee_color_stock:  Record<string, number>;
  tank_color_stock: Record<string, number>;
  stock_status: string;
};

const inputStyle: React.CSSProperties = {
  width: 52, fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700,
  color: "hsl(var(--foreground))", background: "hsl(var(--background))",
  border: "1.5px solid hsl(var(--border))", borderRadius: 6,
  padding: "3px 4px", outline: "none", textAlign: "center",
};

function SizeInputs({ sizes, sizeStock, onChange }: {
  sizes: string[];
  sizeStock: Record<string, number>;
  onChange: (size: string, val: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {sizes.map((size) => {
        const val = sizeStock[size] ?? 0;
        const isOut = val === 0;
        const isLow = val > 0 && val <= LOW_STOCK_THRESHOLD;
        return (
        <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: "0.6rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>
            {size}
          </span>
          <input
            type="number" min={0}
            value={sizeStock[size] ?? 0}
            onChange={(e) => onChange(size, Number(e.target.value))}
            style={{
              ...inputStyle,
              borderColor: isOut ? "#dc2626" : isLow ? "#d97706" : "hsl(var(--border))",
              color: isOut ? "#dc2626" : isLow ? "#d97706" : "hsl(var(--foreground))",
            }}
          />
          {isOut && <span style={{ fontFamily: "Georgia, serif", fontSize: "0.55rem", fontWeight: 700, color: "#dc2626" }}>out</span>}
          {isLow && <span style={{ fontFamily: "Georgia, serif", fontSize: "0.55rem", fontWeight: 700, color: "#d97706" }}>{val} left</span>}
        </div>
        );
      })}
    </div>
  );
}

function SectionDropdown({ title, count, sectionRef, defaultOpen = true, children }: {
  title: string; count?: number; sectionRef?: React.RefObject<HTMLDivElement>; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div ref={sectionRef} className="scroll-mt-6 bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-serif text-base font-black text-foreground">{title}</span>
          {count !== undefined && (
            <span className="font-serif text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {count} product{count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default function AdminInventory() {
  const { data: products = [], isLoading, refetch } = useProducts();
  const [edits,        setEdits]        = useState<Record<string, EditRow>>({});
  const [saving,       setSaving]       = useState<string | null>(null);
  const [filter,       setFilter]       = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [missingCols,  setMissingCols]  = useState(false);
  const { hash } = useLocation();

  const teesTanksRef   = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);
  const limitedRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = (hash === "#tees" || hash === "#tanks" || hash === "#tees-tanks")
      ? teesTanksRef.current
      : hash === "#accessories" ? accessoriesRef.current
      : (hash === "#limited" || hash === "#limited-edition") ? limitedRef.current
      : null;
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [hash]);

  // Init edits — detect if DB columns are missing
  useEffect(() => {
    if (products.length === 0) return;
    // If stock_count is undefined on every product, the column likely doesn't exist yet
    const columnsMissing = products.every((p: any) =>
      p.stock_count === undefined && p.tee_variants === undefined && p.tank_variants === undefined && p.color_stock === undefined
    );
    setMissingCols(columnsMissing);

    const init: Record<string, EditRow> = {};
    products.forEach((p: any) => {
      const { isTee, isTank } = getTypes(p);

      // Tee and Tank stock are separate pools. If a product was saved before
      // per-style tracking existed, it only has the old shared `size_stock`
      // map — seed both pools from it once so nothing looks falsely empty;
      // saving afterwards splits them into real, independent numbers.
      const legacy = parseStockMap(p.size_stock);
      const ownTee = parseStockMap(p.tee_variants);
      const ownTank = parseStockMap(p.tank_variants);

      const existingTeeStock: Record<string, number> = Object.keys(ownTee).length > 0 ? ownTee : { ...legacy };
      const existingTankStock: Record<string, number> = Object.keys(ownTank).length > 0 ? ownTank : { ...legacy };
      const existingColorStock: Record<string, number> = parseStockMap(p.color_stock);

      if (isTee) TEE_SIZES.forEach((s) => { if (existingTeeStock[s] === undefined) existingTeeStock[s] = 0; });
      if (isTank) TANK_SIZES.forEach((s) => { if (existingTankStock[s] === undefined) existingTankStock[s] = 0; });

      // Pre-populate color_stock from variants if empty (accessories)
      const colors = getColorsFromVariants(p);
      colors.forEach((c) => {
        if (existingColorStock[c] === undefined) existingColorStock[c] = 0;
      });

      // Per-style color stock — keyed by the color names chosen in AdminProducts
      const existingTeeColorStock: Record<string, number> = parseStockMap(p.tee_color_stock);
      const existingTankColorStock: Record<string, number> = parseStockMap(p.tank_color_stock);
      getStyleColors(p, "tee").forEach((c) => { if (existingTeeColorStock[c] === undefined) existingTeeColorStock[c] = 0; });
      getStyleColors(p, "tank").forEach((c) => { if (existingTankColorStock[c] === undefined) existingTankColorStock[c] = 0; });

      init[p.id] = {
        stock_count:      p.stock_count  ?? 0,
        tee_stock:        existingTeeStock,
        tank_stock:       existingTankStock,
        color_stock:      existingColorStock,
        tee_color_stock:  existingTeeColorStock,
        tank_color_stock: existingTankColorStock,
        stock_status: p.stock_status ?? "in_stock",
      };
    });
    setEdits(init);
  }, [products]);

  const updateTotalStock = (id: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], stock_count: value, stock_status: autoStatus(value) },
    }));
  };

  // Updates ONLY the given style's pool for that size — Tee S and Tank S
  // are always independent numbers, never combined.
  const updateSizeStock = (id: string, style: "tee" | "tank", size: string, value: number) => {
    setEdits((prev) => {
      const row = prev[id];
      const teeStock  = style === "tee"  ? { ...row.tee_stock,  [size]: value } : row.tee_stock;
      const tankStock = style === "tank" ? { ...row.tank_stock, [size]: value } : row.tank_stock;
      const total = recomputeTotals({ teeStock, tankStock, hasSizeTracking: true }).stock_count;
      return {
        ...prev,
        [id]: { ...row, tee_stock: teeStock, tank_stock: tankStock, stock_count: total, stock_status: autoStatus(total) },
      };
    });
  };

  const updateColorStock = (id: string, color: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], color_stock: { ...prev[id].color_stock, [color]: value } },
    }));
  };

  const updateColorStockByStyle = (id: string, style: "tee" | "tank", color: string, value: number) => {
    const field = style === "tee" ? "tee_color_stock" : "tank_color_stock";
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: { ...prev[id][field], [color]: value } },
    }));
  };

  const handleSave = async (id: string) => {
    if (missingCols) {
      toast.error("Missing DB columns — see setup note above.");
      return;
    }

    const row = edits[id];
    const product = (products as any[]).find((p) => p.id === id);
    const total = row.stock_count;

    // Tee total = sum of tee sizes; Tank total = sum of tank sizes
    const teeTotal  = Object.values(row.tee_stock  || {}).reduce((s: number, v) => s + (v as number), 0);
    const tankTotal = Object.values(row.tank_stock || {}).reduce((s: number, v) => s + (v as number), 0);

    // ── Color stock validation ──────────────────────────────────────────────
    const teeColorNames: string[]  = product?.tee_colors  || [];
    const tankColorNames: string[] = product?.tank_colors || [];
    const accessoryColorNames = Object.keys(row.color_stock || {});

    // Tee colors check — against tee size total only
    if (teeColorNames.length > 0) {
      const teeColorTotal = teeColorNames.reduce((s, c) => s + (row.tee_color_stock[c] ?? 0), 0);
      if (teeColorNames.length === 1) {
        if (teeColorTotal > teeTotal) {
          toast.error(`Tee color "${teeColorNames[0]}" stock (${teeColorTotal}) exceeds Tee total (${teeTotal}). Please reduce it.`);
          return;
        }
      } else {
        if (teeColorTotal > teeTotal) {
          toast.error(`Tee colors add up to ${teeColorTotal} but Tee total is only ${teeTotal}. They can't exceed the Tee total.`);
          return;
        }
        if (teeColorTotal < teeTotal) {
          toast.error(`Tee colors only add up to ${teeColorTotal} but Tee total is ${teeTotal}. All Tee stock must be assigned across colors.`);
          return;
        }
      }
    }

    // Tank colors check — against tank size total only
    if (tankColorNames.length > 0) {
      const tankColorTotal = tankColorNames.reduce((s, c) => s + (row.tank_color_stock[c] ?? 0), 0);
      if (tankColorNames.length === 1) {
        if (tankColorTotal > tankTotal) {
          toast.error(`Tank color "${tankColorNames[0]}" stock (${tankColorTotal}) exceeds Tank total (${tankTotal}). Please reduce it.`);
          return;
        }
      } else {
        if (tankColorTotal > tankTotal) {
          toast.error(`Tank colors add up to ${tankColorTotal} but Tank total is only ${tankTotal}. They can't exceed the Tank total.`);
          return;
        }
        if (tankColorTotal < tankTotal) {
          toast.error(`Tank colors only add up to ${tankColorTotal} but Tank total is ${tankTotal}. All Tank stock must be assigned across colors.`);
          return;
        }
      }
    }

    // Accessory colors check — against flat total
    if (accessoryColorNames.length > 0) {
      const accColorTotal = accessoryColorNames.reduce((s, c) => s + (row.color_stock[c] ?? 0), 0);
      if (accessoryColorNames.length === 1) {
        if (accColorTotal > total) {
          toast.error(`Color "${accessoryColorNames[0]}" stock (${accColorTotal}) exceeds total stock (${total}). Please reduce it.`);
          return;
        }
      } else {
        if (accColorTotal > total) {
          toast.error(`Colors add up to ${accColorTotal} but total stock is only ${total}. They can't exceed the total.`);
          return;
        }
        if (accColorTotal < total) {
          toast.error(`Colors only add up to ${accColorTotal} but total stock is ${total}. All stock must be assigned across colors.`);
          return;
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    setSaving(id);
    try {
      const row = edits[id];
      const { error } = await supabase
        .from("products")
        .update({
          stock_count:      row.stock_count,
          tee_variants:     row.tee_stock,
          tank_variants:    row.tank_stock,
          color_stock:      row.color_stock,
          tee_color_stock:  row.tee_color_stock,
          tank_color_stock: row.tank_color_stock,
          stock_status:     row.stock_status,
        } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Saved! Storefront will update in real time.");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const teesAndTanks   = (products as any[]).filter((p) => p.category === "Tees & Tank Tops");
  const limitedEdition = (products as any[]).filter((p) => p.category === "Limited Edition");
  const accessories    = (products as any[]).filter((p) => p.category === "Accessories");

  const applyFilter = (list: any[]) =>
    list.filter((p: any) =>
      filter === "all" ? true : (edits[p.id]?.stock_status || p.stock_status || "in_stock") === filter
    );

  const countByStatus = (s: string) =>
    (products as any[]).filter((p) =>
      (edits[p.id]?.stock_status || p.stock_status || "in_stock") === s
    ).length;

  // ── Tees & Tanks row renderer ──
  const renderTeeTankRow = (product: any) => {
    const edit = edits[product.id];
    if (!edit) return null;
    const { isTee, isTank } = getTypes(product);
    const colors             = getColorsFromVariants(product);
    const si                 = stockStatusInfo(edit.stock_status, edit.stock_count);
    const StatusIcon         = si.icon;

    return (
      <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/10 align-top">

        {/* Product + type badges */}
        <td className="p-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-serif font-bold text-foreground text-sm leading-tight">{product.name}</span>
            <div className="flex gap-1 flex-wrap">
              {isTee && (
                <span className="font-serif text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "#fce7f3", color: "#9d174d" }}>👕 Tee</span>
              )}
              {isTank && (
                <span className="font-serif text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "#e0f2fe", color: "#0369a1" }}>🎽 Tank</span>
              )}
            </div>
          </div>
        </td>

        {/* Total stock — auto-computed as Tee pool + Tank pool */}
        <td className="p-4 align-middle">
          <input type="number" min={0}
            value={edit.stock_count}
            readOnly
            title="Auto-computed from Tee + Tank sizes below"
            style={{ ...inputStyle, width: 70, opacity: 0.6, cursor: "not-allowed" }}
          />
        </td>

        {/* Tank sizes S·M·L — own pool, independent of Tee sizes */}
        <td className="p-4 align-middle">
          {isTank ? (
            <SizeInputs
              sizes={TANK_SIZES}
              sizeStock={edit.tank_stock}
              onChange={(size, val) => updateSizeStock(product.id, "tank", size, val)}
            />
          ) : (
            <span className="font-serif text-xs text-muted-foreground opacity-40">—</span>
          )}
        </td>

        {/* Tee sizes S·M·L·XL — own pool, independent of Tank sizes */}
        <td className="p-4 align-middle">
          {isTee ? (
            <SizeInputs
              sizes={TEE_SIZES}
              sizeStock={edit.tee_stock}
              onChange={(size, val) => updateSizeStock(product.id, "tee", size, val)}
            />
          ) : (
            <span className="font-serif text-xs text-muted-foreground opacity-40">—</span>
          )}
        </td>

        {/* Tank by Color — uses tank_colors chosen in AdminProducts */}
        <td className="p-4 align-middle">
          {getStyleColors(product, "tank").length > 0 ? (() => {
            const tankColors = getStyleColors(product, "tank");
            const tankSzTotal = Object.values(edit.tank_stock || {}).reduce((s: number, v) => s + (v as number), 0);
            const colorSum = tankColors.reduce((s, c) => s + (edit.tank_color_stock[c] ?? 0), 0);
            const isOver  = colorSum > tankSzTotal;
            const isUnder = tankColors.length > 1 && colorSum < tankSzTotal;
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tankColors.map((color: string) => {
                  const val = edit.tank_color_stock[color] ?? 0;
                  return (
                  <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: PRESET_COLOR_HEX[color] || "#888", border: "1.5px solid hsl(var(--border))", display: "block", boxShadow: color === "White" ? "inset 0 0 0 1px #ccc" : "none" }} />
                    <span style={{ fontFamily: "Georgia, serif", fontSize: "0.55rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", maxWidth: 40, textAlign: "center" }}>{color}</span>
                    <input type="number" min={0}
                      value={val}
                      onChange={(e) => updateColorStockByStyle(product.id, "tank", color, Number(e.target.value))}
                      style={{ ...inputStyle, borderColor: isOver ? "#dc2626" : val === 0 ? "#dc2626" : val <= LOW_STOCK_THRESHOLD ? "#d97706" : "hsl(var(--border))" }}
                    />
                  </div>
                  );
                })}
              </div>
              {tankColors.length > 1 && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: isOver ? "#dc2626" : isUnder ? "#d97706" : "#16a34a" }}>
                  {isOver ? `⚠ Total ${colorSum} exceeds Tank total ${tankSzTotal}` : isUnder ? `⚠ Total ${colorSum} of ${tankSzTotal}` : `✓ ${colorSum} / ${tankSzTotal}`}
                </span>
              )}
              {tankColors.length === 1 && colorSum > tankSzTotal && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: "#dc2626" }}>⚠ Exceeds total stock</span>
              )}
            </div>
            );
          })() : (
            <span className="font-serif text-xs text-muted-foreground opacity-40">—</span>
          )}
        </td>

        {/* Tee by Color — uses tee_colors chosen in AdminProducts */}
        <td className="p-4 align-middle">
          {getStyleColors(product, "tee").length > 0 ? (() => {
            const teeColors = getStyleColors(product, "tee");
            const teeSzTotal = Object.values(edit.tee_stock || {}).reduce((s: number, v) => s + (v as number), 0);
            const colorSum = teeColors.reduce((s, c) => s + (edit.tee_color_stock[c] ?? 0), 0);
            const isOver  = colorSum > teeSzTotal;
            const isUnder = teeColors.length > 1 && colorSum < teeSzTotal;
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {teeColors.map((color: string) => {
                  const val = edit.tee_color_stock[color] ?? 0;
                  return (
                  <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: PRESET_COLOR_HEX[color] || "#888", border: "1.5px solid hsl(var(--border))", display: "block", boxShadow: color === "White" ? "inset 0 0 0 1px #ccc" : "none" }} />
                    <span style={{ fontFamily: "Georgia, serif", fontSize: "0.55rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", maxWidth: 40, textAlign: "center" }}>{color}</span>
                    <input type="number" min={0}
                      value={val}
                      onChange={(e) => updateColorStockByStyle(product.id, "tee", color, Number(e.target.value))}
                      style={{ ...inputStyle, borderColor: isOver ? "#dc2626" : val === 0 ? "#dc2626" : val <= LOW_STOCK_THRESHOLD ? "#d97706" : "hsl(var(--border))" }}
                    />
                  </div>
                  );
                })}
              </div>
              {teeColors.length > 1 && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: isOver ? "#dc2626" : isUnder ? "#d97706" : "#16a34a" }}>
                  {isOver ? `⚠ Total ${colorSum} exceeds Tee total ${teeSzTotal}` : isUnder ? `⚠ Total ${colorSum} of ${teeSzTotal}` : `✓ ${colorSum} / ${teeSzTotal}`}
                </span>
              )}
              {teeColors.length === 1 && colorSum > teeSzTotal && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: "#dc2626" }}>⚠ Exceeds total stock</span>
              )}
            </div>
            );
          })() : (
            <span className="font-serif text-xs text-muted-foreground opacity-40">—</span>
          )}
        </td>

        {/* Status */}
        <td className="p-4 align-middle">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: si.bg, color: si.color, fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "4px 10px", borderRadius: "2rem" }}>
            <StatusIcon size={12} />
            {si.label}
          </span>
        </td>

        {/* Save */}
        <td className="p-4 align-middle">
          <button onClick={() => handleSave(product.id)} disabled={saving === product.id}
            style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Georgia, serif", fontSize: "0.75rem", fontWeight: 700, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "2rem", padding: "6px 14px", cursor: "pointer", opacity: saving === product.id ? 0.6 : 1 }}>
            <Save size={12} />
            {saving === product.id ? "Saving..." : "Save"}
          </button>
        </td>
      </tr>
    );
  };

  // ── Accessories row renderer (no size columns) ──
  const renderAccessoryRow = (product: any) => {
    const edit   = edits[product.id];
    if (!edit) return null;
    const colors     = getColorsFromVariants(product);
    const si         = stockStatusInfo(edit.stock_status, edit.stock_count);
    const StatusIcon = si.icon;

    return (
      <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/10 align-top">

        <td className="p-4 font-serif font-bold text-foreground text-sm align-middle">{product.name}</td>

        {/* Total stock */}
        <td className="p-4 align-middle">
          <input type="number" min={0}
            value={edit.stock_count}
            onChange={(e) => updateTotalStock(product.id, Number(e.target.value))}
            style={{ ...inputStyle, width: 70 }}
          />
        </td>

        {/* Style / color */}
        <td className="p-4 align-middle">
          {colors.length > 0 ? (() => {
            const colorSum = colors.reduce((s: number, c: string) => s + (edit.color_stock[c] ?? 0), 0);
            const isOver  = colorSum > edit.stock_count;
            const isUnder = colors.length > 1 && colorSum < edit.stock_count;
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {colors.map((color: string) => {
                  const val = edit.color_stock[color] ?? 0;
                  return (
                  <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: "0.6rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", maxWidth: 52, textAlign: "center", lineHeight: 1.2 }}>
                      {color}
                    </span>
                    <input type="number" min={0}
                      value={val}
                      onChange={(e) => updateColorStock(product.id, color, Number(e.target.value))}
                      style={{ ...inputStyle, borderColor: isOver ? "#dc2626" : val === 0 ? "#dc2626" : val <= LOW_STOCK_THRESHOLD ? "#d97706" : "hsl(var(--border))" }}
                    />
                  </div>
                  );
                })}
              </div>
              {colors.length > 1 && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: isOver ? "#dc2626" : isUnder ? "#d97706" : "#16a34a" }}>
                  {isOver ? `⚠ Total ${colorSum} exceeds stock ${edit.stock_count}` : isUnder ? `⚠ Total ${colorSum} of ${edit.stock_count}` : `✓ ${colorSum} / ${edit.stock_count}`}
                </span>
              )}
              {colors.length === 1 && colorSum > edit.stock_count && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: "#dc2626" }}>⚠ Exceeds total stock</span>
              )}
            </div>
            );
          })() : (
            <span className="font-serif text-xs text-muted-foreground opacity-40">—</span>
          )}
        </td>

        {/* Status */}
        <td className="p-4 align-middle">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: si.bg, color: si.color, fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "4px 10px", borderRadius: "2rem" }}>
            <StatusIcon size={12} />
            {si.label}
          </span>
        </td>

        {/* Save */}
        <td className="p-4 align-middle">
          <button onClick={() => handleSave(product.id)} disabled={saving === product.id}
            style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Georgia, serif", fontSize: "0.75rem", fontWeight: 700, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "2rem", padding: "6px 14px", cursor: "pointer", opacity: saving === product.id ? 0.6 : 1 }}>
            <Save size={12} />
            {saving === product.id ? "Saving..." : "Save"}
          </button>
        </td>
      </tr>
    );
  };

  if (isLoading) return <div className="font-serif text-sm text-muted-foreground p-8">Loading...</div>;

  const filteredTeeTank     = applyFilter(teesAndTanks);
  const filteredLimited     = applyFilter(limitedEdition);
  const filteredAccessories = applyFilter(accessories);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-foreground">Inventory</h1>
        <p className="font-serif text-xs text-muted-foreground">Stock status updates automatically when you change counts.</p>
      </div>

      {/* ⚠️ Missing columns banner */}
      {missingCols && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-serif text-sm font-bold text-amber-800">Supabase columns missing — saving won't work yet</p>
            <p className="font-serif text-xs text-amber-700">
              Run the setup SQL below in your Supabase dashboard → SQL Editor to add the required columns.
            </p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all",          label: `All (${products.length})` },
          { key: "in_stock",     label: `In Stock (${countByStatus("in_stock")})` },
          { key: "low_stock",    label: `Low Stock (${countByStatus("low_stock")})` },
          { key: "out_of_stock", label: `Out of Stock (${countByStatus("out_of_stock")})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className={`font-serif text-xs px-4 py-2 rounded-full border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-secondary"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Tees & Tanks table ── */}
      <SectionDropdown title="👕🎽 Tees & Tanks" count={filteredTeeTank.length} sectionRef={teesTanksRef}>
        <div className="overflow-x-auto">
          <table className="w-full font-serif text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Product</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Total</th>
                <th className="text-left p-4 text-muted-foreground font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>🎽 Tank Sizes</span>
                    <span className="font-normal text-[10px] opacity-60">S · M · L</span>
                  </div>
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>👕 Tee Sizes</span>
                    <span className="font-normal text-[10px] opacity-60">S · M · L · XL</span>
                  </div>
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium">🎽 Tank by Color</th>
                <th className="text-left p-4 text-muted-foreground font-medium">👕 Tee by Color</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Save</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeeTank.length === 0
                ? <tr><td colSpan={7} className="p-8 text-center font-serif text-sm text-muted-foreground">No products match current filter.</td></tr>
                : filteredTeeTank.map((p: any) => renderTeeTankRow(p))}
            </tbody>
          </table>
        </div>
      </SectionDropdown>

      {/* ── Limited Edition table ── */}
      <SectionDropdown title="✨ Limited Edition" count={filteredLimited.length} sectionRef={limitedRef}>
        <div className="overflow-x-auto">
          <table className="w-full font-serif text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Product</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Total</th>
                <th className="text-left p-4 text-muted-foreground font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>🎽 Tank Sizes</span>
                    <span className="font-normal text-[10px] opacity-60">S · M · L</span>
                  </div>
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>👕 Tee Sizes</span>
                    <span className="font-normal text-[10px] opacity-60">S · M · L · XL</span>
                  </div>
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium">🎽 Tank by Color</th>
                <th className="text-left p-4 text-muted-foreground font-medium">👕 Tee by Color</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Save</th>
              </tr>
            </thead>
            <tbody>
              {filteredLimited.length === 0
                ? <tr><td colSpan={7} className="p-8 text-center font-serif text-sm text-muted-foreground">No limited edition products match current filter.</td></tr>
                : filteredLimited.map((p: any) => renderTeeTankRow(p))}
            </tbody>
          </table>
        </div>
      </SectionDropdown>

      {/* ── Accessories table ── */}
      <SectionDropdown title="✨ Accessories" count={filteredAccessories.length} sectionRef={accessoriesRef}>
        <div className="overflow-x-auto">
          <table className="w-full font-serif text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Product</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Total</th>
                <th className="text-left p-4 text-muted-foreground font-medium">By Style / Color</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Save</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccessories.length === 0
                ? <tr><td colSpan={5} className="p-8 text-center font-serif text-sm text-muted-foreground">No accessories match current filter.</td></tr>
                : filteredAccessories.map((p: any) => renderAccessoryRow(p))}
            </tbody>
          </table>
        </div>
      </SectionDropdown>

    </div>
  );
}