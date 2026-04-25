import { useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useProducts, useUpsertProduct, useDeleteProduct, uploadFile } from "@/hooks/useAdminData";

// ─── Types ────────────────────────────────────────────────────────────────────

// A variant is one selectable OPTION the customer picks from (e.g. "Red")
// A custom_input is a free-form field the customer fills in (e.g. "Bridesmaid date")
type VariantOption = { label: string; name: string; price_diff: number };
type CustomInput = {
  id: string;           // unique key
  label: string;        // shown to customer, e.g. "Wedding Date"
  type: "text" | "date" | "color" | "select";
  required: boolean;
  placeholder?: string; // for text
  options?: string[];   // for select / color (comma-separated hex or names)
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Tees & Tank Tops", "Accessories", "Bagcharms", "Limited Edition"];
const ALL_SIZES   = ["S", "M", "L", "XL"];
const ALL_TAGS    = ["tee", "tank", "charm", "keychain", "necklace", "bracelet"];
const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"];
const INPUT_TYPES: CustomInput["type"][] = ["text", "date", "color", "select"];

const emptyProduct = {
  name: "", description: "", price: 0, category: "Tees & Tank Tops",
  image: "", images: [] as string[], sizes: [] as string[],
  available_as: [] as string[], product_tags: [] as string[],
  stock_status: "in_stock", display_order: 0,
  variants: [] as VariantOption[],
  custom_inputs: [] as CustomInput[],
};

const uid = () => Math.random().toString(36).slice(2, 8);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toggleArr = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

const stockLabel = (s: string) =>
  s === "in_stock" ? "In Stock" : s === "low_stock" ? "Low Stock" : "Out of Stock";
const stockColor = (s: string) =>
  s === "in_stock" ? "bg-green-100 text-green-800" : s === "low_stock" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

// ─── Section header ───────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="font-serif text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 mt-1">{children}</p>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminProducts() {
  const { data: products = [], isLoading } = useProducts();
  const upsert   = useUpsertProduct();
  const deleteMut = useDeleteProduct();

  const [editProduct, setEditProduct] = useState<any>(null);
  const [open, setOpen]               = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [uploading, setUploading]             = useState(false);
  const [uploadingExtra, setUploadingExtra]   = useState(false);

  // ── Variant (option choice) draft ──
  const [vLabel, setVLabel]     = useState("Color");
  const [vName, setVName]       = useState("");
  const [vPriceDiff, setVPriceDiff] = useState(0);

  // ── Custom input draft ──
  const [ciLabel, setCiLabel]           = useState("");
  const [ciType, setCiType]             = useState<CustomInput["type"]>("text");
  const [ciRequired, setCiRequired]     = useState(false);
  const [ciPlaceholder, setCiPlaceholder] = useState("");
  const [ciOptions, setCiOptions]       = useState(""); // comma separated

  const handleNew = () => {
    setEditProduct({ ...emptyProduct, display_order: products.length + 1 });
    setOpen(true);
  };

  const handleEdit = (p: any) => {
    setEditProduct({
      ...p,
      images: p.images || [],
      variants: p.variants || [],
      custom_inputs: p.custom_inputs || [],
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editProduct) return;
    try {
      await upsert.mutateAsync(editProduct);
      setOpen(false);
      toast.success(editProduct.id ? `"${editProduct.name}" updated` : `"${editProduct.name}" created`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success("Product deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Image helpers ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, "products");
      setEditProduct((prev: any) => ({
        ...prev, image: url,
        images: prev.images?.length ? [url, ...prev.images.slice(1)] : [url],
      }));
      toast.success("Cover image uploaded");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const handleExtraImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current: string[] = editProduct?.images || [];
    if (current.length + files.length > 6) { toast.error("Maximum 6 images per product"); return; }
    setUploadingExtra(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadFile(f, "products")));
      setEditProduct((prev: any) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      toast.success(`${urls.length} image(s) added`);
    } catch (err: any) { toast.error(err.message); }
    finally { setUploadingExtra(false); }
  };

  const removeImage = (idx: number) => {
    setEditProduct((prev: any) => {
      const imgs = prev.images.filter((_: string, i: number) => i !== idx);
      return { ...prev, images: imgs, image: imgs[0] || "" };
    });
  };

  // ── Variant helpers ──
  const addVariant = () => {
    if (!vName.trim()) return;
    setEditProduct((prev: any) => ({
      ...prev,
      variants: [...(prev.variants || []), { label: vLabel, name: vName.trim(), price_diff: vPriceDiff }],
    }));
    setVName(""); setVPriceDiff(0);
  };

  const removeVariant = (idx: number) =>
    setEditProduct((prev: any) => ({ ...prev, variants: prev.variants.filter((_: any, i: number) => i !== idx) }));

  // ── Custom input helpers ──
  const addCustomInput = () => {
    if (!ciLabel.trim()) return;
    const ci: CustomInput = {
      id: uid(),
      label: ciLabel.trim(),
      type: ciType,
      required: ciRequired,
      placeholder: ciPlaceholder.trim() || undefined,
      options: ciType === "select" || ciType === "color"
        ? ciOptions.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    };
    setEditProduct((prev: any) => ({ ...prev, custom_inputs: [...(prev.custom_inputs || []), ci] }));
    setCiLabel(""); setCiType("text"); setCiRequired(false); setCiPlaceholder(""); setCiOptions("");
  };

  const removeCustomInput = (id: string) =>
    setEditProduct((prev: any) => ({ ...prev, custom_inputs: prev.custom_inputs.filter((c: CustomInput) => c.id !== id) }));

  const updateCustomInput = (id: string, patch: Partial<CustomInput>) =>
    setEditProduct((prev: any) => ({
      ...prev,
      custom_inputs: prev.custom_inputs.map((c: CustomInput) => c.id === id ? { ...c, ...patch } : c),
    }));

  // ── Derived flags ──
  const showSizes = editProduct?.category === "Tees & Tank Tops" || editProduct?.category === "Limited Edition";

  if (isLoading) return <div className="font-serif text-muted-foreground p-8">Loading products...</div>;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-foreground">Products</h1>
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm text-muted-foreground">{products.length} products</span>
          <Button onClick={handleNew} className="font-serif gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p: any) => (
          <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative">
            <div className="aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden">
              <img src={p.image || p.images?.[0] || ""} alt={p.name} className="w-full h-full object-cover" />
            </div>
            {p.images && p.images.length > 1 && (
              <span className="absolute top-2 left-2 bg-card/90 border border-border font-serif text-[10px] px-1.5 py-0.5 rounded">{p.images.length} photos</span>
            )}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(p)} className="h-8 w-8 bg-card/90 border border-border rounded-lg flex items-center justify-center hover:bg-accent">
                <Pencil className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button onClick={() => setDeleteId(p.id)} className="h-8 w-8 bg-card/90 border border-border rounded-lg flex items-center justify-center hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-serif font-bold text-foreground text-sm">{p.name}</h3>
              <p className="font-serif text-xs text-muted-foreground capitalize">{p.category}</p>
              <p className="font-serif text-foreground font-black">PKR {p.price.toLocaleString()}</p>
              <div className="flex flex-wrap gap-1">
                {p.sizes?.map((s: string) => (
                  <span key={s} className="font-serif text-[10px] px-2 py-0.5 bg-secondary rounded-full text-foreground/70">{s}</span>
                ))}
                {p.variants?.length > 0 && (
                  <span className="font-serif text-[10px] px-2 py-0.5 bg-accent/60 rounded-full text-foreground/70">{p.variants.length} option{p.variants.length !== 1 ? "s" : ""}</span>
                )}
                {p.custom_inputs?.length > 0 && (
                  <span className="font-serif text-[10px] px-2 py-0.5 bg-secondary rounded-full text-foreground/70">{p.custom_inputs.length} custom field{p.custom_inputs.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              <span className={`font-serif text-[10px] px-2 py-0.5 rounded-full ${stockColor(p.stock_status)}`}>{stockLabel(p.stock_status)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editProduct?.id ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>

          {editProduct && (
            <div className="space-y-5">

              {/* Images */}
              <div className="space-y-2">
                <SectionLabel>Product Images <span className="normal-case text-[10px]">(first = cover, max 6)</span></SectionLabel>
                {editProduct.images?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editProduct.images.map((src: string, idx: number) => (
                      <div key={idx} className="relative w-[72px] h-[72px] rounded-lg overflow-hidden border border-border group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground font-serif text-[8px] text-center py-0.5">Cover</span>}
                        <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer font-bold text-[9px]">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="font-serif text-sm" />
                <Input value={editProduct.image} onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })} placeholder="Or paste cover URL" className="font-serif text-sm" />
                {(!editProduct.images || editProduct.images.length < 6) && (
                  <Input type="file" accept="image/*" multiple onChange={handleExtraImageUpload} disabled={uploadingExtra} className="font-serif text-sm" />
                )}
              </div>

              {/* Basic info */}
              <div className="space-y-1">
                <Label className="font-serif text-xs">Name</Label>
                <Input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="font-serif text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-serif text-xs">Category</Label>
                  <Select value={editProduct.category} onValueChange={(v) => setEditProduct({ ...editProduct, category: v })}>
                    <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="font-serif">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="font-serif text-xs">Price (PKR)</Label>
                  <Input type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })} className="font-serif text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-serif text-xs">Description</Label>
                <Textarea value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} className="font-serif text-sm" rows={3} />
              </div>

              {/* Stock */}
              <div className="space-y-1">
                <Label className="font-serif text-xs">Stock Status</Label>
                <Select value={editProduct.stock_status} onValueChange={(v) => setEditProduct({ ...editProduct, stock_status: v })}>
                  <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STOCK_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-serif">{stockLabel(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Sizes (Tees & Limited Edition) */}
              {showSizes && (
                <div className="space-y-2">
                  <SectionLabel>Available Sizes</SectionLabel>
                  <div className="flex gap-2">
                    {ALL_SIZES.map((size) => (
                      <button key={size} onClick={() => setEditProduct({ ...editProduct, sizes: toggleArr(editProduct.sizes, size) })}
                        className={`font-serif text-xs px-3 py-1.5 rounded-lg border transition-colors ${editProduct.sizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tee / Tank availability toggle (Tees & Tank Tops category only) */}
              {editProduct?.category === "Tees & Tank Tops" && (
                <div className="space-y-2">
                  <SectionLabel>Available As <span className="normal-case font-normal text-[10px]">— choose which styles are offered</span></SectionLabel>
                  <div className="flex gap-3">
                    {(["tee", "tank"] as const).map((type) => {
                      const isActive = (editProduct.available_as || []).includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setEditProduct((prev: any) => ({
                            ...prev,
                            available_as: toggleArr(prev.available_as || [], type),
                          }))}
                          className={`font-serif text-xs px-4 py-2 rounded-xl border-2 transition-all capitalize flex items-center gap-2 ${isActive ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/50"}`}
                        >
                          <span>{type === "tee" ? "👕" : "🎽"}</span>
                          {type}
                          {isActive && <span className="text-[9px] opacity-70">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {(editProduct.available_as || []).length === 0 && (
                    <p className="font-serif text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      ⚠️ Select at least one style — if none selected, both will show by default.
                    </p>
                  )}
                  {(editProduct.available_as || []).length === 1 && (
                    <p className="font-serif text-[11px] text-muted-foreground">
                      Only <strong className="capitalize">{editProduct.available_as[0]}</strong> will be shown — the other option is hidden from customers.
                    </p>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  VARIANT OPTIONS — dropdown choices customer selects from
                  (e.g. Color: Red / Blue / Green  or  Charm: Chilli / Olive)
                  ═══════════════════════════════════════════════════════════ */}
              <div className="space-y-2">
                <SectionLabel>Variant Options <span className="normal-case font-normal text-[10px]">— selectable choices (colour, style…)</span></SectionLabel>

                {/* Existing variants */}
                {editProduct.variants?.length > 0 && (
                  <div className="space-y-1.5">
                    {editProduct.variants.map((v: VariantOption, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2">
                        {/* colour swatch preview */}
                        {v.label.toLowerCase() === "color" || v.label.toLowerCase() === "colour" ? (
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: v.name, border: "1px solid hsl(var(--border))", flexShrink: 0 }} />
                        ) : null}
                        <span className="font-serif text-xs text-muted-foreground flex-shrink-0">{v.label}:</span>
                        <span className="font-serif text-xs font-bold text-foreground flex-1">{v.name}</span>
                        {v.price_diff !== 0 && <span className="font-serif text-xs text-muted-foreground">{v.price_diff > 0 ? "+" : ""}PKR {v.price_diff}</span>}
                        <button onClick={() => removeVariant(idx)} className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border-none cursor-pointer text-[10px] font-bold hover:bg-destructive/20">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add variant */}
                <div className="border border-border rounded-lg p-3 space-y-2 bg-secondary/10">
                  <p className="font-serif text-[11px] text-muted-foreground">Add option:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="font-serif text-[10px]">Label (e.g. Color)</Label>
                      <Input value={vLabel} onChange={(e) => setVLabel(e.target.value)} placeholder="Color" className="font-serif text-xs h-8 mt-1" />
                    </div>
                    <div>
                      <Label className="font-serif text-[10px]">Value (e.g. Red or #FF0000)</Label>
                      <Input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Red" className="font-serif text-xs h-8 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="font-serif text-[10px]">Price diff (PKR, 0 = same)</Label>
                      <Input type="number" value={vPriceDiff} onChange={(e) => setVPriceDiff(Number(e.target.value))} className="font-serif text-xs h-8 mt-1" />
                    </div>
                    <Button onClick={addVariant} disabled={!vName.trim()} size="sm" className="font-serif h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  CUSTOM INPUTS — free-form fields customer fills in
                  (e.g. "Bridesmaid Date", "Monogram initials", etc.)
                  ═══════════════════════════════════════════════════════════ */}
              <div className="space-y-2">
                <SectionLabel>Custom Input Fields <span className="normal-case font-normal text-[10px]">— customer fills in at checkout</span></SectionLabel>

                {/* Existing custom inputs */}
                {editProduct.custom_inputs?.length > 0 && (
                  <div className="space-y-2">
                    {editProduct.custom_inputs.map((ci: CustomInput) => (
                      <div key={ci.id} className="border border-border rounded-lg p-3 space-y-2 relative">
                        <button onClick={() => removeCustomInput(ci.id)}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border-none cursor-pointer text-[10px] font-bold hover:bg-destructive/20">✕</button>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="font-serif text-[10px]">Label shown to customer</Label>
                            <Input value={ci.label} onChange={(e) => updateCustomInput(ci.id, { label: e.target.value })} className="font-serif text-xs h-7 mt-1" />
                          </div>
                          <div>
                            <Label className="font-serif text-[10px]">Input type</Label>
                            <Select value={ci.type} onValueChange={(v) => updateCustomInput(ci.id, { type: v as CustomInput["type"] })}>
                              <SelectTrigger className="font-serif text-xs h-7 mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {INPUT_TYPES.map((t) => <SelectItem key={t} value={t} className="font-serif capitalize">{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {(ci.type === "text") && (
                          <div>
                            <Label className="font-serif text-[10px]">Placeholder text</Label>
                            <Input value={ci.placeholder || ""} onChange={(e) => updateCustomInput(ci.id, { placeholder: e.target.value })} className="font-serif text-xs h-7 mt-1" placeholder="e.g. Enter your message…" />
                          </div>
                        )}

                        {(ci.type === "select" || ci.type === "color") && (
                          <div>
                            <Label className="font-serif text-[10px]">
                              {ci.type === "color" ? "Hex codes or colour names (comma-separated)" : "Options (comma-separated)"}
                            </Label>
                            <Input
                              value={(ci.options || []).join(", ")}
                              onChange={(e) => updateCustomInput(ci.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                              className="font-serif text-xs h-7 mt-1"
                              placeholder={ci.type === "color" ? "#FF6B9D, #C5A3C0, #8B4513" : "Option A, Option B, Option C"}
                            />
                            {/* Colour swatches preview */}
                            {ci.type === "color" && ci.options && ci.options.length > 0 && (
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {ci.options.map((col, i) => (
                                  <div key={i} title={col} style={{ width: 20, height: 20, borderRadius: "50%", background: col, border: "1.5px solid hsl(var(--border))" }} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={ci.required} onChange={(e) => updateCustomInput(ci.id, { required: e.target.checked })}
                            style={{ accentColor: "hsl(var(--primary))" }} />
                          <span className="font-serif text-[11px] text-muted-foreground">Required field</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add custom input */}
                <div className="border border-dashed border-border rounded-lg p-3 space-y-2 bg-secondary/10">
                  <p className="font-serif text-[11px] text-muted-foreground">Add new field:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="font-serif text-[10px]">Field label</Label>
                      <Input value={ciLabel} onChange={(e) => setCiLabel(e.target.value)} placeholder="e.g. Wedding Date" className="font-serif text-xs h-8 mt-1" />
                    </div>
                    <div>
                      <Label className="font-serif text-[10px]">Type</Label>
                      <Select value={ciType} onValueChange={(v) => setCiType(v as CustomInput["type"])}>
                        <SelectTrigger className="font-serif text-xs h-8 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INPUT_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="font-serif capitalize">
                              {t === "text" ? "📝 Text" : t === "date" ? "📅 Date" : t === "color" ? "🎨 Color Picker" : "📋 Dropdown"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {ciType === "text" && (
                    <div>
                      <Label className="font-serif text-[10px]">Placeholder</Label>
                      <Input value={ciPlaceholder} onChange={(e) => setCiPlaceholder(e.target.value)} placeholder="e.g. e.g. June 12, 2025" className="font-serif text-xs h-8 mt-1" />
                    </div>
                  )}

                  {(ciType === "select" || ciType === "color") && (
                    <div>
                      <Label className="font-serif text-[10px]">
                        {ciType === "color" ? "Hex codes / colour names (comma-separated)" : "Options (comma-separated)"}
                      </Label>
                      <Input value={ciOptions} onChange={(e) => setCiOptions(e.target.value)}
                        placeholder={ciType === "color" ? "#FF6B9D, #C5A3C0, Ivory" : "Option A, Option B"}
                        className="font-serif text-xs h-8 mt-1" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ciRequired} onChange={(e) => setCiRequired(e.target.checked)}
                        style={{ accentColor: "hsl(var(--primary))" }} />
                      <span className="font-serif text-[11px] text-muted-foreground">Required</span>
                    </label>
                    <Button onClick={addCustomInput} disabled={!ciLabel.trim()} size="sm" className="font-serif h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Field
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <SectionLabel>Product Tags</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => (
                    <button key={tag} onClick={() => setEditProduct({ ...editProduct, product_tags: toggleArr(editProduct.product_tags, tag) })}
                      className={`font-serif text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${editProduct.product_tags.includes(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-serif text-xs">Display Order</Label>
                <Input type="number" value={editProduct.display_order} onChange={(e) => setEditProduct({ ...editProduct, display_order: Number(e.target.value) })} className="font-serif text-sm" />
              </div>

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="font-serif">Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending} className="font-serif">{upsert.isPending ? "Saving…" : "Save Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="font-serif bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
