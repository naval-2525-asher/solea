import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
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
import { useLocation } from "react-router-dom";
import { useProducts, useUpsertProduct, useDeleteProduct, uploadFile } from "@/hooks/useAdminData";

// ─── Types ────────────────────────────────────────────────────────────────────
type VariantOption = { label: string; name: string; price_diff: number };
type CustomInput = {
  id: string;
  label: string;
  type: "text" | "date" | "color" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
};

// ─── Fixed sizes — auto-applied on save, never shown in UI ───────────────────
const TEE_SIZES  = ["S", "M", "L", "XL"];
const TANK_SIZES = ["S", "M", "L"];

// ─── Constants ────────────────────────────────────────────────────────────────
const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"];
const INPUT_TYPES: CustomInput["type"][] = ["text", "date", "color", "select"];
const ALL_TAGS = ["tee", "tank", "charm", "keychain", "necklace", "bracelet"];

const ACCESSORY_STYLE_PRESETS: Record<string, string[]> = {
  "Bag Charms":        ["Chilli Charm", "Olive Charm"],
  "Beaded Bag Charms": ["Pink Palm Tree", "Palm Tree", "Seashell", "Bouquet", "Starfish"],
  "Necklace":          ["Gold", "Silver", "Rose Gold"],
  "Bracelet":          ["Gold", "Silver", "Pearl"],
  "Keychain":          ["Initial", "Heart", "Star"],
};

const emptyProduct = {
  name: "", description: "", price: 0, price_gbp: 0, category: "",
  image: "", images: [] as string[], sizes: [] as string[],
  available_as: [] as string[], product_tags: [] as string[],
  stock_status: "in_stock", display_order: 0,
  variants: [] as VariantOption[],
  custom_inputs: [] as CustomInput[],
  size_guide_tee: "/images/size-guide-tees.png",
  size_guide_tank: "/images/size-guide-tanks.jpg",
  tee_description: "",
  tank_description: "",
};

const uid = () => Math.random().toString(36).slice(2, 8);
const toggleArr = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
const stockLabel = (s: string) =>
  s === "in_stock" ? "In Stock" : s === "low_stock" ? "Low Stock" : "Out of Stock";
const stockColor = (s: string) =>
  s === "in_stock" ? "bg-green-100 text-green-800"
  : s === "low_stock" ? "bg-yellow-100 text-yellow-800"
  : "bg-red-100 text-red-800";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="font-serif text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 mt-1">
    {children}
  </p>
);

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ p, onEdit, onDelete }: { p: any; onEdit: (p: any) => void; onDelete: (id: string) => void }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative">
      <div className="aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden">
        <img src={p.image || p.images?.[0] || ""} alt={p.name} className="w-full h-full object-cover" />
      </div>
      {p.images && p.images.length > 1 && (
        <span className="absolute top-2 left-2 bg-card/90 border border-border font-serif text-[10px] px-1.5 py-0.5 rounded">
          {p.images.length} photos
        </span>
      )}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(p)} className="h-8 w-8 bg-card/90 border border-border rounded-lg flex items-center justify-center hover:bg-accent">
          <Pencil className="h-3.5 w-3.5 text-foreground" />
        </button>
        <button onClick={() => onDelete(p.id)} className="h-8 w-8 bg-card/90 border border-border rounded-lg flex items-center justify-center hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-serif font-bold text-foreground text-sm">{p.name}</h3>
        <p className="font-serif text-xs text-muted-foreground capitalize">{p.category}</p>
        <p className="font-serif text-foreground font-black">PKR {p.price.toLocaleString()}</p>
        {p.price_gbp
          ? <p className="font-serif text-muted-foreground text-xs">£{Number(p.price_gbp).toLocaleString("en-GB")} GBP</p>
          : <p className="font-serif text-muted-foreground text-xs opacity-50">GBP not set</p>}
        <div className="flex flex-wrap gap-1">
          {p.sizes?.map((s: string) => (
            <span key={s} className="font-serif text-[10px] px-2 py-0.5 bg-secondary rounded-full text-foreground/70">{s}</span>
          ))}
          {p.available_as?.includes("tee") && (
            <span className="font-serif text-[10px] px-2 py-0.5 bg-accent/60 rounded-full text-foreground/70">👕 Tee</span>
          )}
          {p.available_as?.includes("tank") && (
            <span className="font-serif text-[10px] px-2 py-0.5 bg-accent/60 rounded-full text-foreground/70">🎽 Tank</span>
          )}
          {p.variants?.length > 0 && (
            <span className="font-serif text-[10px] px-2 py-0.5 bg-secondary rounded-full text-foreground/70">
              {p.variants.length} option{p.variants.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className={`font-serif text-[10px] px-2 py-0.5 rounded-full ${stockColor(p.stock_status)}`}>
          {stockLabel(p.stock_status)}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminProducts() {
  const { data: products = [], isLoading } = useProducts();
  const upsert    = useUpsertProduct();
  const deleteMut = useDeleteProduct();
  const { hash }  = useLocation();

  // Refs for scrolling to sections
  const teesTanksRef   = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);

  // Scroll to section when hash changes
  useEffect(() => {
    const el = hash === "#tees-tanks" ? teesTanksRef.current
             : hash === "#accessories" ? accessoriesRef.current
             : null;
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [hash]);

  const [editProduct,    setEditProduct]    = useState<any>(null);
  const [open,           setOpen]           = useState(false);
  const [deleteId,       setDeleteId]       = useState<string | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [uploadingSgTee,  setUploadingSgTee]  = useState(false);
  const [uploadingSgTank, setUploadingSgTank] = useState(false);

  // Variant draft
  const [vLabel,     setVLabel]     = useState("Color");
  const [vName,      setVName]      = useState("");
  const [vPriceDiff, setVPriceDiff] = useState(0);

  // Custom input draft
  const [ciLabel,       setCiLabel]       = useState("");
  const [ciType,        setCiType]        = useState<CustomInput["type"]>("text");
  const [ciRequired,    setCiRequired]    = useState(false);
  const [ciPlaceholder, setCiPlaceholder] = useState("");
  const [ciOptions,     setCiOptions]     = useState("");

  // Which section's "Add" was clicked — determines dialog mode
  const [dialogSection, setDialogSection] = useState<"tees-tanks" | "limited" | "accessories">("tees-tanks");

  const openNew = (section: "tees-tanks" | "accessories") => {
    setDialogSection(section);
    setEditProduct({
      ...emptyProduct,
      category: section === "accessories" ? "Accessories" : section === "limited" ? "Limited Edition" : "Tees & Tank Tops",
      display_order: products.length + 1,
    });
    setOpen(true);
  };

  const openEdit = (p: any) => {
    const section = p.category === "Accessories" ? "accessories" : p.category === "Limited Edition" ? "limited" : "tees-tanks";
    setDialogSection(section);
    setEditProduct({ ...p, images: p.images || [], variants: p.variants || [], custom_inputs: p.custom_inputs || [], size_guide_tee: p.size_guide_tee || "/images/size-guide-tees.png", size_guide_tank: p.size_guide_tank || "/images/size-guide-tanks.jpg", tee_description: p.tee_description || "", tank_description: p.tank_description || "" });
    setOpen(true);
  };

  // ── Save — auto-apply fixed sizes for tees/tanks ──
  const handleSave = async () => {
    if (!editProduct) return;
    try {
      let toSave = { ...editProduct };
      if (dialogSection === "tees-tanks") {
        const isTank = toSave.available_as?.includes("tank") && !toSave.available_as?.includes("tee");
        toSave.sizes = isTank ? TANK_SIZES : TEE_SIZES;
      }
      await upsert.mutateAsync(toSave);
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


  const handleSizeGuideTeeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSgTee(true);
    try {
      const url = await uploadFile(file, "products");
      setEditProduct((prev: any) => ({ ...prev, size_guide_tee: url }));
      toast.success("Tee size guide uploaded");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploadingSgTee(false); }
  };

  const handleSizeGuideTankUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSgTank(true);
    try {
      const url = await uploadFile(file, "products");
      setEditProduct((prev: any) => ({ ...prev, size_guide_tank: url }));
      toast.success("Tank size guide uploaded");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploadingSgTank(false); }
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

  const addPresetVariants = (presetName: string) => {
    const options = ACCESSORY_STYLE_PRESETS[presetName] || [];
    setEditProduct((prev: any) => ({
      ...prev,
      variants: [...(prev.variants || []), ...options.map((name) => ({ label: "Style", name, price_diff: 0 }))],
    }));
    toast.success(`Added ${options.length} style options`);
  };

  // ── Custom input helpers ──
  const addCustomInput = () => {
    if (!ciLabel.trim()) return;
    const ci: CustomInput = {
      id: uid(), label: ciLabel.trim(), type: ciType, required: ciRequired,
      placeholder: ciPlaceholder.trim() || undefined,
      options: ciType === "select" || ciType === "color"
        ? ciOptions.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
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

  // ── Categorise ──
  const teesAndTanks = products.filter((p: any) => p.category === "Tees & Tank Tops");
  const limitedEdition = products.filter((p: any) => p.category === "Limited Edition");
  const accessories  = products.filter((p: any) => p.category === "Accessories");

  if (isLoading) return <div className="font-serif text-muted-foreground p-8">Loading products...</div>;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-foreground">Products</h1>
        <span className="font-serif text-sm text-muted-foreground">{products.length} total</span>
      </div>

      {/* ── Tees & Tanks section ── */}
      <div ref={teesTanksRef} className="scroll-mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-black text-foreground">👕 Tees &amp; Tanks</h2>
            <span className="font-serif text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {teesAndTanks.length}
            </span>
          </div>
          <Button onClick={() => openNew("tees-tanks")} size="sm" className="font-serif gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
        {teesAndTanks.length === 0 ? (
          <p className="font-serif text-sm text-muted-foreground py-4">No tees or tanks yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teesAndTanks.map((p: any) => (
              <ProductCard key={p.id} p={p} onEdit={openEdit} onDelete={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* ── Accessories section ── */}
      <div ref={accessoriesRef} className="scroll-mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-black text-foreground">✨ Accessories</h2>
            <span className="font-serif text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {accessories.length}
            </span>
          </div>
          <Button onClick={() => openNew("accessories")} size="sm" className="font-serif gap-2">
            <Plus className="h-4 w-4" /> Add Accessory
          </Button>
        </div>
        {accessories.length === 0 ? (
          <p className="font-serif text-sm text-muted-foreground py-4">No accessories yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {accessories.map((p: any) => (
              <ProductCard key={p.id} p={p} onEdit={openEdit} onDelete={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* ── Limited Edition section ── */}
      <div className="scroll-mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-black text-foreground">✨ Limited Edition</h2>
            <span className="font-serif text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {limitedEdition.length}
            </span>
          </div>
          <Button onClick={() => openNew("limited")} size="sm" className="font-serif gap-2">
            <Plus className="h-4 w-4" /> Add Limited
          </Button>
        </div>
        {limitedEdition.length === 0 ? (
          <p className="font-serif text-sm text-muted-foreground py-4">No limited edition items yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {limitedEdition.map((p: any) => (
              <ProductCard key={p.id} p={p} onEdit={openEdit} onDelete={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      {/* ════════ ADD / EDIT DIALOG ════════ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editProduct?.id
                ? `Edit ${dialogSection === "accessories" ? "Accessory" : "Product"}`
                : `Add ${dialogSection === "accessories" ? "Accessory" : "Product"}`}
            </DialogTitle>
            {dialogSection === "tees-tanks" && (
              <p className="font-serif text-[11px] text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
                ℹ️ Sizes are fixed automatically — Tees get S/M/L/XL, Tanks get S/M/L
              </p>
            )}
          </DialogHeader>

          {editProduct && (
            <div className="space-y-5">

              {/* Images */}
              <div className="space-y-2">
                <SectionLabel>Images <span className="normal-case text-[10px]">(first = cover, max 6)</span></SectionLabel>
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

              {/* Name */}
              <div className="space-y-1">
                <Label className="font-serif text-xs">Name</Label>
                <Input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="font-serif text-sm" />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-serif text-xs">Price (PKR 🇵🇰)</Label>
                  <Input type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })} className="font-serif text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="font-serif text-xs">Price (GBP 🇬🇧)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-sm text-muted-foreground">£</span>
                    <Input type="number" step="0.01" value={editProduct.price_gbp ?? 0} onChange={(e) => setEditProduct({ ...editProduct, price_gbp: Number(e.target.value) })} className="font-serif text-sm pl-7" placeholder="0.00" />
                  </div>
                </div>
              </div>

              {/* Description */}
              {(dialogSection === "tees-tanks" || dialogSection === "limited") ? (
                <div className="space-y-3">
                  <SectionLabel>Descriptions</SectionLabel>
                  <div className="space-y-1">
                    <Label className="font-serif text-xs">👕 Tee Description</Label>
                    <Textarea value={editProduct.tee_description || ""} onChange={(e) => setEditProduct({ ...editProduct, tee_description: e.target.value })} className="font-serif text-sm" rows={2} placeholder="Description shown when customer selects Tee…" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-serif text-xs">🎽 Tank Description</Label>
                    <Textarea value={editProduct.tank_description || ""} onChange={(e) => setEditProduct({ ...editProduct, tank_description: e.target.value })} className="font-serif text-sm" rows={2} placeholder="Description shown when customer selects Tank…" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="font-serif text-xs">Description</Label>
                  <Textarea value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} className="font-serif text-sm" rows={3} />
                </div>
              )}

              {/* Stock status */}
              <div className="space-y-1">
                <Label className="font-serif text-xs">Stock Status</Label>
                <Select value={editProduct.stock_status} onValueChange={(v) => setEditProduct({ ...editProduct, stock_status: v })}>
                  <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STOCK_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-serif">{stockLabel(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* ── TEES & TANKS: Available As (tee / tank / both) ── */}
              {dialogSection === "tees-tanks" && (
                <div className="space-y-2">
                  <SectionLabel>Available As</SectionLabel>
                  <div className="flex gap-3">
                    {(["tee", "tank"] as const).map((type) => {
                      const isActive = (editProduct.available_as || []).includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setEditProduct((prev: any) => ({
                            ...prev,
                            available_as: toggleArr(prev.available_as || [], type),
                            product_tags: toggleArr(prev.product_tags || [], type),
                          }))}
                          className={`font-serif text-xs px-4 py-2 rounded-xl border-2 transition-all capitalize flex items-center gap-2 ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/50"
                          }`}
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
                      ⚠️ Select at least one — if none selected, both will show by default.
                    </p>
                  )}
                </div>
              )}

              {/* ── LIMITED EDITION: Available As (tee / tank / both) ── */}
              {dialogSection === "limited" && (
                <div className="space-y-2">
                  <SectionLabel>Available As</SectionLabel>
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
                          className={`font-serif text-xs px-4 py-2 rounded-xl border-2 transition-all capitalize flex items-center gap-2 ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/50"
                          }`}
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
                      ⚠️ Select at least one — if none selected, both will show by default.
                    </p>
                  )}
                </div>
              )}

              {/* ── ACCESSORIES: quick style presets ── */}
              {dialogSection === "accessories" && (
                <div className="space-y-2">
                  <SectionLabel>Quick Style Presets</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ACCESSORY_STYLE_PRESETS).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => addPresetVariants(preset)}
                        className="font-serif text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary transition-colors text-foreground"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                  <p className="font-serif text-[10px] text-muted-foreground">Or add options manually below.</p>
                </div>
              )}


              {/* ── SIZE GUIDE IMAGES (tees-tanks + limited) ── */}
              {(dialogSection === "tees-tanks" || dialogSection === "limited") && (
                <div className="space-y-3">
                  <SectionLabel>Size Guide Images <span className="normal-case font-normal text-[10px]">— shown in product page accordion</span></SectionLabel>

                  {/* Tee Size Guide */}
                  <div className="border border-border rounded-lg p-3 space-y-2 bg-secondary/10">
                    <p className="font-serif text-[11px] font-bold text-muted-foreground">👕 Tee Size Guide</p>
                    {editProduct.size_guide_tee && (
                      <div className="relative w-full max-w-[160px] rounded-lg overflow-hidden border border-border group">
                        <img src={editProduct.size_guide_tee} alt="Tee size guide" className="w-full h-auto object-cover" />
                        <button onClick={() => setEditProduct((prev: any) => ({ ...prev, size_guide_tee: "" }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer text-[9px] font-bold">✕</button>
                      </div>
                    )}
                    <Input type="file" accept="image/*" onChange={handleSizeGuideTeeUpload} disabled={uploadingSgTee} className="font-serif text-xs" />
                    <Input value={editProduct.size_guide_tee || ""} onChange={(e) => setEditProduct({ ...editProduct, size_guide_tee: e.target.value })} placeholder="Or paste URL — default: /images/size-guide-tees.png" className="font-serif text-xs" />
                  </div>

                  {/* Tank Size Guide */}
                  <div className="border border-border rounded-lg p-3 space-y-2 bg-secondary/10">
                    <p className="font-serif text-[11px] font-bold text-muted-foreground">🎽 Tank Size Guide</p>
                    {editProduct.size_guide_tank && (
                      <div className="relative w-full max-w-[160px] rounded-lg overflow-hidden border border-border group">
                        <img src={editProduct.size_guide_tank} alt="Tank size guide" className="w-full h-auto object-cover" />
                        <button onClick={() => setEditProduct((prev: any) => ({ ...prev, size_guide_tank: "" }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer text-[9px] font-bold">✕</button>
                      </div>
                    )}
                    <Input type="file" accept="image/*" onChange={handleSizeGuideTankUpload} disabled={uploadingSgTank} className="font-serif text-xs" />
                    <Input value={editProduct.size_guide_tank || ""} onChange={(e) => setEditProduct({ ...editProduct, size_guide_tank: e.target.value })} placeholder="Or paste URL — default: /images/size-guide-tanks.jpg" className="font-serif text-xs" />
                  </div>
                </div>
              )}
              {/* ── VARIANT OPTIONS ── */}
              <div className="space-y-2">
                <SectionLabel>
                  {dialogSection === "accessories" ? "Style Options" : "Variant Options"}
                  <span className="normal-case font-normal text-[10px]"> — selectable choices (colour, style…)</span>
                </SectionLabel>

                {editProduct.variants?.length > 0 && (
                  <div className="space-y-1.5">
                    {editProduct.variants.map((v: VariantOption, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2">
                        {(v.label.toLowerCase() === "color" || v.label.toLowerCase() === "colour") && (
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: v.name, border: "1px solid hsl(var(--border))", flexShrink: 0 }} />
                        )}
                        <span className="font-serif text-xs text-muted-foreground flex-shrink-0">{v.label}:</span>
                        <span className="font-serif text-xs font-bold text-foreground flex-1">{v.name}</span>
                        {v.price_diff !== 0 && <span className="font-serif text-xs text-muted-foreground">{v.price_diff > 0 ? "+" : ""}PKR {v.price_diff}</span>}
                        <button onClick={() => removeVariant(idx)} className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border-none cursor-pointer text-[10px] font-bold hover:bg-destructive/20">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-border rounded-lg p-3 space-y-2 bg-secondary/10">
                  <p className="font-serif text-[11px] text-muted-foreground">Add option:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="font-serif text-[10px]">Label</Label>
                      <Input value={vLabel} onChange={(e) => setVLabel(e.target.value)} placeholder={dialogSection === "accessories" ? "Style" : "Color"} className="font-serif text-xs h-8 mt-1" />
                    </div>
                    <div>
                      <Label className="font-serif text-[10px]">Value</Label>
                      <Input value={vName} onChange={(e) => setVName(e.target.value)} placeholder={dialogSection === "accessories" ? "e.g. Chilli Charm" : "e.g. Red"} className="font-serif text-xs h-8 mt-1" />
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

              {/* ── CUSTOM INPUT FIELDS ── */}
              <div className="space-y-2">
                <SectionLabel>Custom Input Fields <span className="normal-case font-normal text-[10px]">— customer fills in at checkout</span></SectionLabel>

                {editProduct.custom_inputs?.length > 0 && (
                  <div className="space-y-2">
                    {editProduct.custom_inputs.map((ci: CustomInput) => (
                      <div key={ci.id} className="border border-border rounded-lg p-3 space-y-2 relative">
                        <button onClick={() => removeCustomInput(ci.id)} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border-none cursor-pointer text-[10px] font-bold hover:bg-destructive/20">✕</button>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="font-serif text-[10px]">Label</Label>
                            <Input value={ci.label} onChange={(e) => updateCustomInput(ci.id, { label: e.target.value })} className="font-serif text-xs h-7 mt-1" />
                          </div>
                          <div>
                            <Label className="font-serif text-[10px]">Type</Label>
                            <Select value={ci.type} onValueChange={(v) => updateCustomInput(ci.id, { type: v as CustomInput["type"] })}>
                              <SelectTrigger className="font-serif text-xs h-7 mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>{INPUT_TYPES.map((t) => <SelectItem key={t} value={t} className="font-serif capitalize">{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        {ci.type === "text" && (
                          <div>
                            <Label className="font-serif text-[10px]">Placeholder</Label>
                            <Input value={ci.placeholder || ""} onChange={(e) => updateCustomInput(ci.id, { placeholder: e.target.value })} className="font-serif text-xs h-7 mt-1" />
                          </div>
                        )}
                        {(ci.type === "select" || ci.type === "color") && (
                          <div>
                            <Label className="font-serif text-[10px]">{ci.type === "color" ? "Hex codes (comma-separated)" : "Options (comma-separated)"}</Label>
                            <Input value={(ci.options || []).join(", ")} onChange={(e) => updateCustomInput(ci.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="font-serif text-xs h-7 mt-1" />
                            {ci.type === "color" && ci.options && ci.options.length > 0 && (
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {ci.options.map((col, i) => <div key={i} title={col} style={{ width: 20, height: 20, borderRadius: "50%", background: col, border: "1.5px solid hsl(var(--border))" }} />)}
                              </div>
                            )}
                          </div>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={ci.required} onChange={(e) => updateCustomInput(ci.id, { required: e.target.checked })} style={{ accentColor: "hsl(var(--primary))" }} />
                          <span className="font-serif text-[11px] text-muted-foreground">Required field</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

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
                      <Input value={ciPlaceholder} onChange={(e) => setCiPlaceholder(e.target.value)} placeholder="e.g. June 12, 2025" className="font-serif text-xs h-8 mt-1" />
                    </div>
                  )}
                  {(ciType === "select" || ciType === "color") && (
                    <div>
                      <Label className="font-serif text-[10px]">{ciType === "color" ? "Hex codes (comma-separated)" : "Options (comma-separated)"}</Label>
                      <Input value={ciOptions} onChange={(e) => setCiOptions(e.target.value)} placeholder={ciType === "color" ? "#FF6B9D, #C5A3C0" : "Option A, Option B"} className="font-serif text-xs h-8 mt-1" />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ciRequired} onChange={(e) => setCiRequired(e.target.checked)} style={{ accentColor: "hsl(var(--primary))" }} />
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
                    <button
                      key={tag}
                      onClick={() => setEditProduct({ ...editProduct, product_tags: toggleArr(editProduct.product_tags, tag) })}
                      className={`font-serif text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                        editProduct.product_tags.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display order */}
              <div className="space-y-1">
                <Label className="font-serif text-xs">Display Order</Label>
                <Input type="number" value={editProduct.display_order} onChange={(e) => setEditProduct({ ...editProduct, display_order: Number(e.target.value) })} className="font-serif text-sm" />
              </div>

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="font-serif">Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending} className="font-serif">
              {upsert.isPending ? "Saving…" : "Save Product"}
            </Button>
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