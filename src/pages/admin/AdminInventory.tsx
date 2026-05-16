import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const stockStatusInfo = (status: string, count: number) => {
  if (status === "out_of_stock" || count === 0) return { label: "Out of Stock", color: "#dc2626", bg: "#fee2e2", icon: XCircle };
  if (status === "low_stock" || count <= 5) return { label: "Low Stock", color: "#d97706", bg: "#fef3c7", icon: AlertTriangle };
  return { label: "In Stock", color: "#16a34a", bg: "#dcfce7", icon: CheckCircle };
};

const autoStatus = (count: number) => {
  if (count === 0) return "out_of_stock";
  if (count <= 5) return "low_stock";
  return "in_stock";
};

type EditRow = {
  stock_count: number;
  size_stock: Record<string, number>;
  color_stock: Record<string, number>;
  stock_status: string;
};

export default function AdminInventory() {
  const { data: products = [], isLoading, refetch } = useProducts();
  const [edits, setEdits] = useState<Record<string, EditRow>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Init edits from products
  useEffect(() => {
    if (products.length === 0) return;
    const init: Record<string, EditRow> = {};
    products.forEach((p: any) => {
      init[p.id] = {
        stock_count: p.stock_count ?? 0,
        size_stock: p.size_stock ?? {},
        color_stock: p.color_stock ?? {},
        stock_status: p.stock_status ?? "in_stock",
      };
    });
    setEdits(init);
  }, [products]);

  const updateField = (id: string, field: keyof EditRow, value: any) => {
    setEdits((prev) => {
      const updated = { ...prev[id], [field]: value };
      // Auto update status based on stock count
      if (field === "stock_count") {
        updated.stock_status = autoStatus(Number(value));
      }
      return { ...prev, [id]: updated };
    });
  };

  const updateSizeStock = (id: string, size: string, value: number) => {
    setEdits((prev) => {
      const sizeStock = { ...prev[id].size_stock, [size]: value };
      const total = Object.values(sizeStock).reduce((a, b) => a + b, 0);
      return {
        ...prev,
        [id]: {
          ...prev[id],
          size_stock: sizeStock,
          stock_count: total,
          stock_status: autoStatus(total),
        },
      };
    });
  };

  const updateColorStock = (id: string, color: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], color_stock: { ...prev[id].color_stock, [color]: value } },
    }));
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    try {
      const row = edits[id];
      const { error } = await supabase
        .from("products")
        .update({
          stock_count: row.stock_count,
          size_stock: row.size_stock,
          color_stock: row.color_stock,
          stock_status: row.stock_status,
        } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Inventory updated!");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const filtered = products.filter((p: any) => {
    if (filter === "all") return true;
    const status = edits[p.id]?.stock_status || p.stock_status || "in_stock";
    return status === filter;
  });

  const inputStyle = {
    width: 60, fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700,
    color: "hsl(var(--foreground))", background: "hsl(var(--background))",
    border: "1.5px solid hsl(var(--border))", borderRadius: 6,
    padding: "3px 6px", outline: "none", textAlign: "center" as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-foreground">Inventory</h1>
        <p className="font-serif text-xs text-muted-foreground">Changes save per product row. Stock status updates automatically.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: `All (${products.length})` },
          { key: "in_stock", label: `In Stock (${products.filter((p: any) => (edits[p.id]?.stock_status || p.stock_status) === "in_stock").length})` },
          { key: "low_stock", label: `Low Stock (${products.filter((p: any) => (edits[p.id]?.stock_status || p.stock_status) === "low_stock").length})` },
          { key: "out_of_stock", label: `Out of Stock (${products.filter((p: any) => (edits[p.id]?.stock_status || p.stock_status) === "out_of_stock").length})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`font-serif text-xs px-4 py-2 rounded-full border capitalize transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="font-serif text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full font-serif text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Product</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Category</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Total Stock</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Stock by Size</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Stock by Color</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Save</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product: any) => {
                  const edit = edits[product.id];
                  if (!edit) return null;
                  const si = stockStatusInfo(edit.stock_status, edit.stock_count);
                  const StatusIcon = si.icon;
                  const sizes: string[] = product.sizes || [];
                  // Get colors from variants
                  const variants = product.variants || [];
                  const colors = variants
                    .filter((v: any) => v.label?.toLowerCase() === "color" || v.label?.toLowerCase() === "colour")
                    .map((v: any) => v.name);

                  return (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/10">
                      {/* Name */}
                      <td className="p-4 font-bold text-foreground">{product.name}</td>

                      {/* Category */}
                      <td className="p-4 text-muted-foreground text-xs">{product.category}</td>

                      {/* Total stock count */}
                      <td className="p-4">
                        <input
                          type="number"
                          min={0}
                          value={edit.stock_count}
                          onChange={(e) => updateField(product.id, "stock_count", Number(e.target.value))}
                          style={{ ...inputStyle, width: 70 }}
                        />
                      </td>

                      {/* Size stock */}
                      <td className="p-4">
                        {sizes.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {sizes.map((size: string) => (
                              <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>{size}</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={edit.size_stock[size] ?? 0}
                                  onChange={(e) => updateSizeStock(product.id, size, Number(e.target.value))}
                                  style={inputStyle}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontFamily: "Georgia, serif", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>N/A</span>
                        )}
                      </td>

                      {/* Color stock */}
                      <td className="p-4">
                        {colors.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {colors.map((color: string) => (
                              <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", maxWidth: 50, textAlign: "center", lineHeight: 1.2 }}>{color}</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={edit.color_stock[color] ?? 0}
                                  onChange={(e) => updateColorStock(product.id, color, Number(e.target.value))}
                                  style={inputStyle}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontFamily: "Georgia, serif", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>N/A</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: si.bg, color: si.color, fontFamily: "Georgia, serif", fontSize: "0.72rem", fontWeight: 700, padding: "4px 10px", borderRadius: "2rem" }}>
                          <StatusIcon size={12} />
                          {si.label}
                        </span>
                      </td>

                      {/* Save button */}
                      <td className="p-4">
                        <button
                          onClick={() => handleSave(product.id)}
                          disabled={saving === product.id}
                          style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Georgia, serif", fontSize: "0.75rem", fontWeight: 700, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "2rem", padding: "6px 14px", cursor: "pointer", opacity: saving === product.id ? 0.6 : 1 }}
                        >
                          <Save size={12} />
                          {saving === product.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}