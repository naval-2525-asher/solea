import { useState, useEffect, useRef } from "react";
import { useProducts } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, AlertTriangle, CheckCircle, XCircle, ChevronDown, AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const TEE_SIZES  = ["S", "M", "L", "XL"];
const TANK_SIZES = ["S", "M", "L"];

const stockStatusInfo = (status: string, count: number) => {
  if (status === "out_of_stock" || count === 0)
    return { label: "Out of Stock", color: "#dc2626", bg: "#fee2e2", icon: XCircle };
  if (status === "low_stock" || count <= 5)
    return { label: "Low Stock",    color: "#d97706", bg: "#fef3c7", icon: AlertTriangle };
  return   { label: "In Stock",     color: "#16a34a", bg: "#dcfce7", icon: CheckCircle };
};

const autoStatus = (count: number) =>
  count === 0 ? "out_of_stock" : count <= 5 ? "low_stock" : "in_stock";

// A product can be tee, tank, or both
const getTypes = (product: any): { isTee: boolean; isTank: boolean } => {
  const tags: string[] = product.product_tags || [];
  const avAs: string[] = product.available_as  || [];
  const combined = [...tags, ...avAs];
  const isTank = combined.includes("tank");
  const isTee  = combined.includes("tee") || (!isTank); // default to tee if no tag
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

type EditRow = {
  stock_count:  number;
  size_stock:   Record<string, number>;
  color_stock:  Record<string, number>;
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
      {sizes.map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: "0.6rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>
            {size}
          </span>
          <input
            type="number" min={0}
            value={sizeStock[size] ?? 0}
            onChange={(e) => onChange(size, Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      ))}
    </div>
  );
}

function SectionDropdown({ title, count, sectionRef, children }: {
  title: string; count: number; sectionRef?: React.RefObject<HTMLDivElement>; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div ref={sectionRef} className="scroll-mt-6 bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-serif text-base font-black text-foreground">{title}</span>
          <span className="font-serif text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
            {count} product{count !== 1 ? "s" : ""}
          </span>
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

  useEffect(() => {
    const el = (hash === "#tees" || hash === "#tanks" || hash === "#tees-tanks")
      ? teesTanksRef.current
      : hash === "#accessories" ? accessoriesRef.current : null;
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [hash]);

  // Init edits — detect if DB columns are missing
  useEffect(() => {
    if (products.length === 0) return;
    const firstProduct = products[0] as any;
    // If stock_count is undefined on every product, the column likely doesn't exist yet
    const columnsMissing = products.every((p: any) =>
      p.stock_count === undefined && p.size_stock === undefined && p.color_stock === undefined
    );
    setMissingCols(columnsMissing);

    const init: Record<string, EditRow> = {};
    products.forEach((p: any) => {
      // Pre-populate size_stock from existing sizes array if size_stock is empty
      const existingSizeStock: Record<string, number> = p.size_stock ?? {};
      const existingColorStock: Record<string, number> = p.color_stock ?? {};

      // If size_stock is empty but sizes exist, init all sizes to 0
      const { isTee, isTank } = getTypes(p);
      const applicableSizes = [
        ...(isTee  ? TEE_SIZES  : []),
        ...(isTank ? TANK_SIZES : []),
      ];
      // deduplicate
      const uniqueSizes = Array.from(new Set(applicableSizes));
      uniqueSizes.forEach((s) => {
        if (existingSizeStock[s] === undefined) existingSizeStock[s] = 0;
      });

      // Pre-populate color_stock from variants if empty
      const colors = getColorsFromVariants(p);
      colors.forEach((c) => {
        if (existingColorStock[c] === undefined) existingColorStock[c] = 0;
      });

      init[p.id] = {
        stock_count:  p.stock_count  ?? 0,
        size_stock:   existingSizeStock,
        color_stock:  existingColorStock,
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

  const updateSizeStock = (id: string, size: string, value: number) => {
    setEdits((prev) => {
      const sizeStock = { ...prev[id].size_stock, [size]: value };
      const total     = Object.values(sizeStock).reduce((a, b) => a + b, 0);
      return { ...prev, [id]: { ...prev[id], size_stock: sizeStock, stock_count: total, stock_status: autoStatus(total) } };
    });
  };

  const updateColorStock = (id: string, color: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], color_stock: { ...prev[id].color_stock, [color]: value } },
    }));
  };

  const handleSave = async (id: string) => {
    if (missingCols) {
      toast.error("Missing DB columns — see setup note above.");
      return;
    }
    setSaving(id);
    try {
      const row = edits[id];
      const { error } = await supabase
        .from("products")
        .update({
          stock_count:  row.stock_count,
          size_stock:   row.size_stock,
          color_stock:  row.color_stock,
          stock_status: row.stock_status,
        } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Saved!");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const teesAndTanks = (products as any[]).filter((p) => p.category === "Tees & Tank Tops");
  const accessories  = (products as any[]).filter((p) => p.category === "Accessories");

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

        {/* Total stock */}
        <td className="p-4 align-middle">
          <input type="number" min={0}
            value={edit.stock_count}
            onChange={(e) => updateTotalStock(product.id, Number(e.target.value))}
            style={{ ...inputStyle, width: 70 }}
          />
        </td>

        {/* Tank sizes S·M·L */}
        <td className="p-4 align-middle">
          {isTank ? (
            <SizeInputs
              sizes={TANK_SIZES}
              sizeStock={edit.size_stock}
              onChange={(size, val) => updateSizeStock(product.id, size, val)}
            />
          ) : (
            <span className="font-serif text-xs text-muted-foreground opacity-40">—</span>
          )}
        </td>

        {/* Tee sizes S·M·L·XL */}
        <td className="p-4 align-middle">
          {isTee ? (
            <SizeInputs
              sizes={TEE_SIZES}
              sizeStock={edit.size_stock}
              onChange={(size, val) => updateSizeStock(product.id, size, val)}
            />
          ) : (
            <span className="font-serif text-xs text-muted-foreground opacity-40">—</span>
          )}
        </td>

        {/* By color — pulled from variants */}
        <td className="p-4 align-middle">
          {colors.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {colors.map((color: string) => (
                <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: "0.6rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", maxWidth: 50, textAlign: "center", lineHeight: 1.2 }}>
                    {color}
                  </span>
                  <input type="number" min={0}
                    value={edit.color_stock[color] ?? 0}
                    onChange={(e) => updateColorStock(product.id, color, Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          ) : (
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
          {colors.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {colors.map((color: string) => (
                <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: "0.6rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", maxWidth: 52, textAlign: "center", lineHeight: 1.2 }}>
                    {color}
                  </span>
                  <input type="number" min={0}
                    value={edit.color_stock[color] ?? 0}
                    onChange={(e) => updateColorStock(product.id, color, Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          ) : (
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
              Run this SQL in your Supabase dashboard → SQL Editor to add the required columns:
            </p>
            <pre className="font-mono text-[11px] bg-amber-100 text-amber-900 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap mt-1">{`ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_stock  jsonb    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS color_stock jsonb    DEFAULT '{}';`}</pre>
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
                <th className="text-left p-4 text-muted-foreground font-medium">By Color</th>
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