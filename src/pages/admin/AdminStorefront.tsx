import { useState } from "react";
import { Trash2, Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  useHeroBanners, useUpsertHeroBanner, useDeleteHeroBanner,
  useBestSellers, useUpsertBestSeller, useDeleteBestSeller,
  useNewArrivals, useUpsertNewArrival, useDeleteNewArrival,
  useSaleProducts, useUpsertSaleProduct, useDeleteSaleProduct,
  useSiteSettings, useUpdateSiteSetting,
  useProducts, uploadFile,
} from "@/hooks/useAdminData";

export default function AdminStorefront() {
  const { data: banners = [] } = useHeroBanners();
  const { data: bestSellers = [] } = useBestSellers();
  const { data: newArrivals = [] } = useNewArrivals();
  const { data: saleProducts = [] } = useSaleProducts();
  const { data: settings = [] } = useSiteSettings();
  const { data: products = [] } = useProducts();

  const upsertBanner = useUpsertHeroBanner();
  const deleteBanner = useDeleteHeroBanner();
  const upsertBestSeller = useUpsertBestSeller();
  const deleteBestSeller = useDeleteBestSeller();
  const upsertArrival = useUpsertNewArrival();
  const deleteArrival = useDeleteNewArrival();
  const upsertSale = useUpsertSaleProduct();
  const deleteSale = useDeleteSaleProduct();
  const updateSetting = useUpdateSiteSetting();

  const announcementText = settings.find((s: any) => s.key === "announcement_text")?.value || "";
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Best seller dialog
  const [bsOpen, setBsOpen] = useState(false);
  const [bsProduct, setBsProduct] = useState("");

  // New arrival dialog (product picker — same pattern as best sellers)
  const [naOpen, setNaOpen] = useState(false);
  const [naProduct, setNaProduct] = useState("");

  // Sale dialog
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleProduct, setSaleProduct] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "banners");
      await upsertBanner.mutateAsync({ image: url, display_order: banners.length + 1 });
      toast.success("Banner added");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveAnnouncement = async () => {
    try {
      await updateSetting.mutateAsync({ key: "announcement_text", value: announcement || "" });
      setAnnouncement(null);
      toast.success("Announcement updated");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddBestSeller = async () => {
    if (!bsProduct) return;
    try {
      await upsertBestSeller.mutateAsync({ product_id: bsProduct, display_order: bestSellers.length + 1 });
      setBsOpen(false); setBsProduct("");
      toast.success("Best seller added");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddNewArrival = async () => {
    if (!naProduct) return;
    // Check if already in the list
    const alreadyAdded = newArrivals.some((a: any) => a.product_id === naProduct);
    if (alreadyAdded) { toast.error("Product already in New Arrivals"); return; }
    try {
      await upsertArrival.mutateAsync({ product_id: naProduct, display_order: newArrivals.length + 1 });
      setNaOpen(false); setNaProduct("");
      toast.success("Added to New Arrivals");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddSaleProduct = async () => {
    if (!saleProduct || !salePrice) return;
    const already = saleProducts.some((s: any) => s.product_id === saleProduct);
    if (already) { toast.error("Product already on sale"); return; }
    try {
      await upsertSale.mutateAsync({ product_id: saleProduct, sale_price: Number(salePrice), display_order: saleProducts.length + 1 });
      setSaleOpen(false); setSaleProduct(""); setSalePrice("");
      toast.success("Added to Sale");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "banner") await deleteBanner.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === "bestSeller") await deleteBestSeller.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === "arrival") await deleteArrival.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === "sale") await deleteSale.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-2xl font-black text-foreground">Storefront Manager</h1>

      {/* Announcement Bar */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-foreground">Announcement Bar</h2>
        <p className="font-serif text-xs text-muted-foreground">This text scrolls at the top of every page.</p>
        <div className="flex gap-2">
          <Input
            value={announcement !== null ? announcement : announcementText}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="font-serif text-sm flex-1"
            placeholder="Enter announcement text..."
          />
          <Button onClick={handleSaveAnnouncement} disabled={announcement === null || updateSetting.isPending} className="font-serif">Save</Button>
        </div>
      </section>

      {/* Hero Banners */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">Hero Banner Images</h2>
            <p className="font-serif text-xs text-muted-foreground">The scrolling photo strip on the homepage.</p>
          </div>
          <Label htmlFor="banner-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-serif text-sm hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Add Image
            </div>
            <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} />
          </Label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {banners.map((b: any, i: number) => (
            <div key={b.id} className="relative group rounded-lg overflow-hidden border border-border aspect-[3/4]">
              <img src={b.image} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => setDeleteTarget({ type: "banner", id: b.id })}
                className="absolute top-1 right-1 h-6 w-6 bg-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
              <span className="absolute bottom-1 left-1 font-serif text-[10px] bg-card/80 px-1.5 py-0.5 rounded">#{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">Best Sellers</h2>
            <p className="font-serif text-xs text-muted-foreground">Select products to feature as best sellers on the homepage.</p>
          </div>
          <Button onClick={() => setBsOpen(true)} className="font-serif gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bestSellers.map((bs: any) => (
            <div key={bs.id} className="bg-card border border-border rounded-xl overflow-hidden group relative">
              <div className="aspect-square bg-secondary/30 overflow-hidden">
                {bs.products?.image ? (
                  <img src={bs.products.image} alt={bs.products.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /></div>
                )}
              </div>
              <button
                onClick={() => setDeleteTarget({ type: "bestSeller", id: bs.id })}
                className="absolute top-1 right-1 h-6 w-6 bg-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
              <div className="p-3">
                <p className="font-serif font-bold text-sm text-foreground">{bs.products?.name || "Unknown"}</p>
                <p className="font-serif text-xs text-muted-foreground">PKR {bs.products?.price?.toLocaleString()}</p>
                <p className="font-serif text-[10px] text-muted-foreground/60 mt-0.5">{bs.products?.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">New Arrivals</h2>
            <p className="font-serif text-xs text-muted-foreground">Featured on the homepage — select any product from any category.</p>
          </div>
          <Button onClick={() => setNaOpen(true)} className="font-serif gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {newArrivals.map((a: any) => (
            <div key={a.id} className="bg-card border border-border rounded-xl overflow-hidden group relative">
              <div className="aspect-square bg-secondary/30 overflow-hidden">
                {a.products?.image ? (
                  <img src={a.products.image} alt={a.products.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /></div>
                )}
              </div>
              <button
                onClick={() => setDeleteTarget({ type: "arrival", id: a.id })}
                className="absolute top-1 right-1 h-6 w-6 bg-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
              <div className="p-3">
                <p className="font-serif font-bold text-sm text-foreground">{a.products?.name || "Unknown"}</p>
                <p className="font-serif text-xs text-muted-foreground">PKR {a.products?.price?.toLocaleString()}</p>
                <p className="font-serif text-[10px] text-muted-foreground/60 mt-0.5">{a.products?.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sale Products */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">Sale Products</h2>
            <p className="font-serif text-xs text-muted-foreground">Pick products and set their discounted sale price. Shown on the homepage with a red SALE badge.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live toggle */}
            <button
              onClick={async () => {
                const current = settings.find((s: any) => s.key === "sale_live")?.value === "true";
                try {
                  await updateSetting.mutateAsync({ key: "sale_live", value: current ? "false" : "true" });
                  toast.success(current ? "Sale taken offline" : "Sale is now LIVE! 🏷️");
                } catch (e: any) { toast.error(e.message); }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: settings.find((s: any) => s.key === "sale_live")?.value === "true" ? "#dc2626" : "hsl(var(--secondary))",
                color: settings.find((s: any) => s.key === "sale_live")?.value === "true" ? "#fff" : "hsl(var(--muted-foreground))",
                border: "none", borderRadius: "999px", padding: "8px 18px",
                fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 13,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: settings.find((s: any) => s.key === "sale_live")?.value === "true" ? "#fff" : "hsl(var(--muted-foreground))", display: "inline-block", animation: settings.find((s: any) => s.key === "sale_live")?.value === "true" ? "pulse 1.5s infinite" : "none" }} />
              {settings.find((s: any) => s.key === "sale_live")?.value === "true" ? "LIVE — Click to Stop" : "Go Live"}
            </button>
            <Button onClick={() => setSaleOpen(true)} className="font-serif gap-2"><Plus className="h-4 w-4" /> Add</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {saleProducts.map((sp: any) => (
            <div key={sp.id} className="bg-card border border-border rounded-xl overflow-hidden group relative">
              <div className="aspect-square bg-secondary/30 overflow-hidden">
                {(sp.products?.image || sp.products?.images?.[0]) ? (
                  <img src={sp.products.image || sp.products.images?.[0]} alt={sp.products?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /></div>
                )}
                <span className="absolute top-2 left-2 bg-red-500 text-white font-serif text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</span>
              </div>
              <button
                onClick={() => setDeleteTarget({ type: "sale", id: sp.id })}
                className="absolute top-1 right-1 h-6 w-6 bg-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
              <div className="p-3">
                <p className="font-serif font-bold text-sm text-foreground">{sp.products?.name || "Unknown"}</p>
                <p className="font-serif text-xs text-muted-foreground line-through">PKR {sp.products?.price?.toLocaleString()}</p>
                <p className="font-serif text-xs text-red-500 font-bold">PKR {Number(sp.sale_price).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Best Seller Dialog */}
      <Dialog open={bsOpen} onOpenChange={setBsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-serif">Add Best Seller</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="font-serif text-xs">Select Product</Label>
            <Select value={bsProduct} onValueChange={setBsProduct}>
              <SelectTrigger className="font-serif text-sm"><SelectValue placeholder="Choose a product" /></SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="font-serif">
                    {p.name} — PKR {p.price.toLocaleString()} <span className="text-muted-foreground text-xs">({p.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBsOpen(false)} className="font-serif">Cancel</Button>
            <Button onClick={handleAddBestSeller} disabled={!bsProduct || upsertBestSeller.isPending} className="font-serif">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Arrival Dialog */}
      <Dialog open={naOpen} onOpenChange={setNaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-serif">Add New Arrival</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="font-serif text-xs">Select Product</Label>
            <Select value={naProduct} onValueChange={setNaProduct}>
              <SelectTrigger className="font-serif text-sm"><SelectValue placeholder="Choose a product" /></SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="font-serif">
                    {p.name} — PKR {p.price.toLocaleString()} <span className="text-muted-foreground text-xs">({p.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNaOpen(false)} className="font-serif">Cancel</Button>
            <Button onClick={handleAddNewArrival} disabled={!naProduct || upsertArrival.isPending} className="font-serif">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sale Product Dialog */}
      <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-serif">Add Sale Product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="font-serif text-xs">Select Product</Label>
            <Select value={saleProduct} onValueChange={setSaleProduct}>
              <SelectTrigger className="font-serif text-sm"><SelectValue placeholder="Choose a product" /></SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="font-serif">
                    {p.name} — PKR {p.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="font-serif text-xs">Sale Price (PKR)</Label>
            <Input
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="e.g. 3500"
              className="font-serif text-sm"
            />
            {saleProduct && salePrice && (
              <p className="font-serif text-xs text-muted-foreground">
                Original: PKR {products.find((p: any) => p.id === saleProduct)?.price?.toLocaleString()} →{" "}
                <span className="text-red-500 font-bold">Sale: PKR {Number(salePrice).toLocaleString()}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleOpen(false)} className="font-serif">Cancel</Button>
            <Button onClick={handleAddSaleProduct} disabled={!saleProduct || !salePrice || upsertSale.isPending} className="font-serif">Add to Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete item?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="font-serif bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}