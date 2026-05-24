import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useProductConfig,
  useUpsertProductConfig,
  useDeleteProductConfig,
  defaultConfig,
  limitedId,
  ALL_SIZES,
} from "@/hooks/useProductConfig";
import type { ProductConfigRow, ProductConfig, ProductColor, Size } from "@/hooks/useProductConfig";

// ── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);
const toggleArr = <T,>(arr: T[], v: T): T[] =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

// ── ColorEditor ───────────────────────────────────────────────────────────────
function ColorEditor({
  colors,
  onChange,
}: {
  colors: ProductColor[];
  onChange: (c: ProductColor[]) => void;
}) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#ffffff");

  const add = () => {
    if (!name.trim()) return;
    onChange([...colors, { name: name.trim(), hex }]);
    setName("");
    setHex("#ffffff");
  };

  return (
    <div className="space-y-2">
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-secondary/50 border border-border rounded-full pl-1 pr-2 py-0.5"
            >
              <div
                style={{ width: 18, height: 18, borderRadius: "50%", background: c.hex, border: "1.5px solid hsl(var(--border))" }}
              />
              <span className="font-serif text-xs text-foreground">{c.name}</span>
              <button
                onClick={() => onChange(colors.filter((_, j) => j !== i))}
                className="w-4 h-4 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border-none cursor-pointer text-[9px] font-bold hover:bg-destructive/20"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="font-serif text-[10px]">Color name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ivory White"
            className="font-serif text-xs h-8"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
        <div className="space-y-1">
          <Label className="font-serif text-[10px]">Hex</Label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              style={{ width: 32, height: 32, borderRadius: 6, border: "1.5px solid hsl(var(--border))", padding: 2, cursor: "pointer", background: "none" }}
            />
            <Input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="font-serif text-xs h-8 w-24"
            />
          </div>
        </div>
        <Button onClick={add} disabled={!name.trim()} size="sm" className="font-serif h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

// ── ProductConfigCard ─────────────────────────────────────────────────────────
function ProductConfigCard({
  row,
  onSave,
  onDelete,
  allowDelete = false,
}: {
  row: ProductConfigRow;
  onSave: (updated: ProductConfigRow) => Promise<void>;
  onDelete?: () => void;
  allowDelete?: boolean;
}) {
  const [cfg, setCfg] = useState<ProductConfig>({ ...row.config });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<ProductConfig>) => setCfg((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ ...row, config: cfg });
    } finally {
      setSaving(false);
    }
  };

  const stockBg = cfg.in_stock ? "#dcfce7" : "#fee2e2";
  const stockColor = cfg.in_stock ? "#16a34a" : "#dc2626";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header row — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <GripVertical size={14} className="text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm font-bold text-foreground truncate">{cfg.label || row.product_type}</p>
          {cfg.badge && (
            <span className="font-serif text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{cfg.badge}</span>
          )}
        </div>
        <span
          style={{ background: stockBg, color: stockColor, fontFamily: "Georgia, serif", fontSize: "0.68rem", fontWeight: 700, padding: "3px 9px", borderRadius: "2rem" }}
        >
          {cfg.in_stock ? "In Stock" : "Out of Stock"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {cfg.colors.slice(0, 5).map((c, i) => (
            <div key={i} title={c.name} style={{ width: 12, height: 12, borderRadius: "50%", background: c.hex, border: "1px solid hsl(var(--border))" }} />
          ))}
          {cfg.colors.length > 5 && <span className="font-serif text-[10px] text-muted-foreground">+{cfg.colors.length - 5}</span>}
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-serif text-xs">Display Label</Label>
              <Input value={cfg.label} onChange={(e) => update({ label: e.target.value })} className="font-serif text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="font-serif text-xs">Badge <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={cfg.badge ?? ""} onChange={(e) => update({ badge: e.target.value || null })} placeholder="e.g. New Drop, Coming Soon" className="font-serif text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-serif text-xs">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea value={cfg.description ?? ""} onChange={(e) => update({ description: e.target.value || null })} className="font-serif text-sm" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-serif text-xs">Price (PKR 🇵🇰)</Label>
              <Input type="number" value={cfg.price_pkr} onChange={(e) => update({ price_pkr: Number(e.target.value) })} className="font-serif text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="font-serif text-xs">Price (GBP 🇬🇧)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-sm text-muted-foreground">£</span>
                <Input type="number" step="0.01" value={cfg.price_gbp} onChange={(e) => update({ price_gbp: Number(e.target.value) })} className="font-serif text-sm pl-7" />
              </div>
            </div>
          </div>

          {/* In stock toggle */}
          <div className="flex items-center gap-3">
            <Label className="font-serif text-xs">Stock status</Label>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => update({ in_stock: v })}
                  className="font-serif text-xs px-3 py-1.5 rounded-full border transition-colors"
                  style={{
                    background: cfg.in_stock === v ? (v ? "#dcfce7" : "#fee2e2") : "transparent",
                    color: cfg.in_stock === v ? (v ? "#16a34a" : "#dc2626") : "hsl(var(--muted-foreground))",
                    borderColor: cfg.in_stock === v ? (v ? "#bbf7d0" : "#fecaca") : "hsl(var(--border))",
                    fontWeight: 700,
                  }}
                >
                  {v ? "In Stock" : "Out of Stock"}
                </button>
              ))}
            </div>
          </div>

          {/* Available Sizes */}
          <div className="space-y-2">
            <Label className="font-serif text-xs">Available Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => update({ sizes: toggleArr(cfg.sizes, s as Size) })}
                  className="font-serif text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    background: cfg.sizes.includes(s as Size) ? "hsl(var(--primary))" : "transparent",
                    color: cfg.sizes.includes(s as Size) ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                    borderColor: cfg.sizes.includes(s as Size) ? "hsl(var(--primary))" : "hsl(var(--border))",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label className="font-serif text-xs">Available Colors</Label>
            <ColorEditor colors={cfg.colors} onChange={(c) => update({ colors: c })} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {allowDelete && onDelete ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="font-serif text-xs text-destructive hover:bg-destructive/10 h-8"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            ) : <div />}
            <Button onClick={save} disabled={saving} size="sm" className="font-serif h-8 text-xs">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCustomisation() {
  const { data: allRows = [], isLoading } = useProductConfig();
  const upsert = useUpsertProductConfig();
  const deleteCfg = useDeleteProductConfig();

  const [newLimitedName, setNewLimitedName] = useState("");

  const shopRows = allRows.filter((r) => r.section === "shop");
  const limitedRows = allRows.filter((r) => r.section === "limited").sort((a, b) => a.sort_order - b.sort_order);

  const handleSave = async (row: ProductConfigRow) => {
    await upsert.mutateAsync(row);
  };

  const handleAddLimited = async () => {
    const name = newLimitedName.trim();
    if (!name) return;
    await upsert.mutateAsync({
      id: limitedId(),
      section: "limited",
      product_type: name.toLowerCase().replace(/\s+/g, "_"),
      config: defaultConfig(name),
      sort_order: limitedRows.length + 1,
    });
    setNewLimitedName("");
    toast.success(`"${name}" added to Limited Edition`);
  };

  const handleDeleteLimited = async (id: string) => {
    if (!confirm("Remove this product type from Limited Edition?")) return;
    await deleteCfg.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-black text-foreground">Customisation</h1>
        <div className="font-serif text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings2 size={22} className="text-primary" />
        <h1 className="font-serif text-2xl font-black text-foreground">Product Customisation</h1>
      </div>

      <p className="font-serif text-sm text-muted-foreground -mt-4">
        Configure available colors, sizes, pricing, and stock for each product type. Changes are reflected immediately on the storefront.
      </p>

      {/* ── SHOP SECTION ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px flex-1 bg-border" />
          <h2 className="font-serif text-xs font-black uppercase tracking-widest text-muted-foreground px-3">
            🛍 Shop — Tanks &amp; Tees
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="font-serif text-xs text-muted-foreground">
          Separate configurations for Tees and Tanks in the main shop.
        </p>

        {shopRows.length === 0 ? (
          <div className="bg-secondary/30 border border-dashed border-border rounded-xl p-6 text-center">
            <p className="font-serif text-sm text-muted-foreground">
              No shop config yet. Run the SQL migration to seed default Tees & Tanks rows.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shopRows.map((row) => (
              <ProductConfigCard key={row.id} row={row} onSave={handleSave} allowDelete={false} />
            ))}
          </div>
        )}
      </section>

      {/* ── LIMITED EDITION SECTION ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px flex-1 bg-border" />
          <h2 className="font-serif text-xs font-black uppercase tracking-widest text-muted-foreground px-3">
            ✦ Limited Edition
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="font-serif text-xs text-muted-foreground">
          Add any product type (Sweatshirts, Hoodies, Crop Tops, etc.) with its own colors, sizes and pricing.
        </p>

        {limitedRows.length > 0 && (
          <div className="space-y-3">
            {limitedRows.map((row) => (
              <ProductConfigCard
                key={row.id}
                row={row}
                onSave={handleSave}
                onDelete={() => handleDeleteLimited(row.id)}
                allowDelete
              />
            ))}
          </div>
        )}

        {/* Add new Limited Edition product type */}
        <div className="bg-secondary/20 border border-dashed border-border rounded-xl p-4 space-y-3">
          <p className="font-serif text-xs font-bold text-foreground">Add new product type to Limited Edition</p>
          <div className="flex gap-2">
            <Input
              value={newLimitedName}
              onChange={(e) => setNewLimitedName(e.target.value)}
              placeholder="e.g. Sweatshirt, Hoodie, Crop Top…"
              className="font-serif text-sm flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddLimited()}
            />
            <Button onClick={handleAddLimited} disabled={!newLimitedName.trim() || upsert.isPending} className="font-serif gap-1.5">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </section>

      {/* ── SQL migration reminder ── */}
      <section className="bg-secondary/30 border border-border rounded-xl p-4 space-y-2">
        <p className="font-serif text-xs font-bold text-foreground">Database Setup</p>
        <p className="font-serif text-[11px] text-muted-foreground leading-relaxed">
          Make sure the <code className="bg-secondary rounded px-1">product_config</code> table exists and the default Shop rows are seeded. Run in Supabase SQL Editor:
        </p>
        <pre className="bg-card border border-border rounded-lg p-3 font-mono text-[10px] text-foreground overflow-x-auto whitespace-pre-wrap">{`-- 1. Create table
CREATE TABLE IF NOT EXISTS product_config (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  product_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed default Shop rows (Tees & Tanks)
INSERT INTO product_config (id, section, product_type, config, sort_order)
VALUES
  ('shop_tees', 'shop', 'tees', '{"label":"Tees","badge":null,"description":null,"price_pkr":4000,"price_gbp":12,"in_stock":true,"colors":[{"name":"White","hex":"#FFFFFF"},{"name":"Black","hex":"#1a1a1a"}],"sizes":["XS","S","M","L","XL","XXL"]}', 1),
  ('shop_tanks', 'shop', 'tanks', '{"label":"Tanks","badge":null,"description":null,"price_pkr":3500,"price_gbp":11,"in_stock":true,"colors":[{"name":"White","hex":"#FFFFFF"},{"name":"Black","hex":"#1a1a1a"}],"sizes":["XS","S","M","L","XL"]}', 2)
ON CONFLICT (id) DO NOTHING;`}
        </pre>
      </section>
    </div>
  );
}
