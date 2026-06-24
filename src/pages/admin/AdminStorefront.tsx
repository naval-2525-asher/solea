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

  const announcementPKText = settings.find((s: any) => s.key === "announcement_text_pk")?.value || "";
  const announcementUKText = settings.find((s: any) => s.key === "announcement_text_uk")?.value || "";
  const [announcementPK, setAnnouncementPK] = useState<string | null>(null);
  const [announcementUK, setAnnouncementUK] = useState<string | null>(null);
  const [uploadingCatKey, setUploadingCatKey] = useState<string | null>(null);

  const CATEGORY_SETTINGS = [
    { key: "category_image_tees", label: "Tees & Tank Tops", defaultImg: "/images/categories/tees-tanks.jpg" },
    { key: "category_image_limited", label: "Limited Edition", defaultImg: "/images/categories/limited-edition.jpg" },
    { key: "category_image_accessories", label: "Accessories", defaultImg: "/images/categories/accessories.jpg" },
  ];

  const handleUploadCategoryImage = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCatKey(settingKey);
    try {
      const url = await uploadFile(file, "category-images");
      await updateSetting.mutateAsync({ key: settingKey, value: url });
      toast.success("Category image updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingCatKey(null);
      e.target.value = "";
    }
  };
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
  const [salePriceGbp, setSalePriceGbp] = useState("");

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "banners");
      await upsertBanner.mutateAsync({ image: url, display_order: banners.length + 1 });
      toast.success("Banner added");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveAnnouncementPK = async () => {
    try {
      await updateSetting.mutateAsync({ key: "announcement_text_pk", value: announcementPK || "" });
      setAnnouncementPK(null);
      toast.success("Pakistan announcement updated");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveAnnouncementUK = async () => {
    try {
      await updateSetting.mutateAsync({ key: "announcement_text_uk", value: announcementUK || "" });
      setAnnouncementUK(null);
      toast.success("UK announcement updated");
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
      await upsertSale.mutateAsync({
        product_id: saleProduct,
        sale_price: Number(salePrice),
        sale_price_gbp: salePriceGbp ? Number(salePriceGbp) : null,
        display_order: saleProducts.length + 1,
      });
      setSaleOpen(false); setSaleProduct(""); setSalePrice(""); setSalePriceGbp("");
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

      {/* Category Card Images */}
      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground">Shop by Category — Images</h2>
          <p className="font-serif text-xs text-muted-foreground">The images shown on the homepage category cards. Click a card to replace the image.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CATEGORY_SETTINGS.map((cat) => {
            const currentImg = settings.find((s: any) => s.key === cat.key)?.value || cat.defaultImg;
            const isUploading = uploadingCatKey === cat.key;
            return (
              <div key={cat.key} className="bg-card border border-border rounded-xl overflow-hidden group relative">
                <div className="aspect-[3/2] bg-secondary/30 overflow-hidden relative">
                  <img
                    src={currentImg}
                    alt={cat.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="font-serif text-white text-xs animate-pulse">Uploading…</span>
                    </div>
                  )}
                  {/* Upload overlay on hover */}
                  <Label
                    htmlFor={`cat-upload-${cat.key}`}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity mb-1" />
                    <span className="font-serif text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Replace Image</span>
                    <input
                      id={`cat-upload-${cat.key}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadCategoryImage(e, cat.key)}
                      disabled={isUploading}
                    />
                  </Label>
                </div>
                <div className="p-3">
                  <p className="font-serif font-bold text-sm text-foreground">{cat.label}</p>
                  <p className="font-serif text-[10px] text-muted-foreground mt-0.5">
                    {settings.find((s: any) => s.key === cat.key)?.value ? "Custom image set" : "Using default image"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Announcement Bars */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-foreground">Announcement Bars</h2>
        <p className="font-serif text-xs text-muted-foreground">Scrolling text shown at the top — each region sees their own.</p>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <span className="font-serif text-sm font-bold text-foreground whitespace-nowrap">🇵🇰 Pakistan</span>
            <Input
              value={announcementPK !== null ? announcementPK : announcementPKText}
              onChange={(e) => setAnnouncementPK(e.target.value)}
              className="font-serif text-sm flex-1"
              placeholder="Pakistan announcement text..."
            />
            <Button onClick={handleSaveAnnouncementPK} disabled={announcementPK === null || updateSetting.isPending} className="font-serif">Save</Button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-serif text-sm font-bold text-foreground whitespace-nowrap">🇬🇧 UK</span>
            <Input
              value={announcementUK !== null ? announcementUK : announcementUKText}
              onChange={(e) => setAnnouncementUK(e.target.value)}
              className="font-serif text-sm flex-1"
              placeholder="UK announcement text..."
            />
            <Button onClick={handleSaveAnnouncementUK} disabled={announcementUK === null || updateSetting.isPending} className="font-serif">Save</Button>
          </div>
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
            <Select value={saleProduct} onValueChange={(v) => { setSaleProduct(v); setSalePrice(""); setSalePriceGbp(""); }}>
              <SelectTrigger className="font-serif text-sm"><SelectValue placeholder="Choose a product" /></SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="font-serif">
                    {p.name} — PKR {p.price.toLocaleString()}{(p as any).price_gbp ? ` / £${Number((p as any).price_gbp).toLocaleString("en-GB")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {saleProduct && (() => {
              const prod = products.find((p: any) => p.id === saleProduct);
              return prod ? (
                <p className="font-serif text-[11px] text-muted-foreground bg-secondary/40 rounded px-2 py-1.5">
                  Original: <strong>PKR {prod.price?.toLocaleString()}</strong>
                  {(prod as any).price_gbp ? <> &nbsp;/&nbsp; <strong>£{Number((prod as any).price_gbp).toLocaleString("en-GB")}</strong></> : " (no GBP price set)"}
                </p>
              ) : null;
            })()}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-serif text-xs">Sale Price (PKR 🇵🇰)</Label>
                <Input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="e.g. 3500"
                  className="font-serif text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-serif text-xs">Sale Price (GBP 🇬🇧)</Label>
                <Input
                  type="number"
                  value={salePriceGbp}
                  onChange={(e) => setSalePriceGbp(e.target.value)}
                  placeholder="e.g. 28.99"
                  className="font-serif text-sm"
                />
              </div>
            </div>

            {saleProduct && (salePrice || salePriceGbp) && (() => {
              const prod = products.find((p: any) => p.id === saleProduct);
              if (!prod) return null;
              const pkrDiscount = salePrice && prod.price ? Math.round(((prod.price - Number(salePrice)) / prod.price) * 100) : null;
              const gbpDiscount = salePriceGbp && (prod as any).price_gbp ? Math.round((((prod as any).price_gbp - Number(salePriceGbp)) / (prod as any).price_gbp) * 100) : null;
              return (
                <p className="font-serif text-xs text-muted-foreground">
                  {pkrDiscount !== null && <span className="text-red-500 font-bold">PKR save {pkrDiscount}%</span>}
                  {pkrDiscount !== null && gbpDiscount !== null && " · "}
                  {gbpDiscount !== null && <span className="text-red-500 font-bold">GBP save {gbpDiscount}%</span>}
                </p>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaleOpen(false); setSalePriceGbp(""); }} className="font-serif">Cancel</Button>
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