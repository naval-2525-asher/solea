import { useState } from "react";
import { Pencil, Trash2, Plus, ArchiveRestore, Archive, Rocket, ImageIcon } from "lucide-react";
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
import {
  useCategories, useUpsertCategory, useArchiveCategory, useDeleteCategory,
  useProducts, uploadFile,
} from "@/hooks/useAdminData";

// "New" badge shows on the home tile / menu item for this many days after launch.
const NEW_BADGE_DAYS = 14;
export const isRecentlyLaunched = (launchedAt: string | null | undefined) => {
  if (!launchedAt) return false;
  const days = (Date.now() - new Date(launchedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= NEW_BADGE_DAYS;
};

// Tri-state: force_new_badge = true always shows it, false always hides it,
// null/undefined falls back to the automatic 14-day window.
export const getShowNewBadge = (cat: any) => {
  if (cat.force_new_badge === true) return true;
  if (cat.force_new_badge === false) return false;
  return cat.status === "live" && isRecentlyLaunched(cat.launched_at);
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft:        { label: "Draft",        className: "bg-secondary text-muted-foreground" },
  coming_soon:  { label: "Coming Soon",  className: "bg-amber-100 text-amber-700 border border-amber-200" },
  live:         { label: "Live",         className: "bg-green-100 text-green-700 border border-green-200" },
  archived:     { label: "Archived",     className: "bg-destructive/10 text-destructive border border-destructive/20" },
};

const emptyCategory = {
  name: "", slug: "", category_type: "wearable", description: "",
  image_url: "", display_order: 0, menu_order: null as number | null, status: "draft",
  force_new_badge: null as boolean | null,
};

// The 3 categories with a genuinely hardcoded admin/storefront section —
// Archive/Delete stay hidden for these specifically, to protect the site's
// core structure. Bagcharms is "built-in" (has its own storefront page) but
// isn't in this list, so it can be archived/deleted like any other category
// once it has no products.
const HARDCODED_ADMIN_SECTIONS = ["Tees & Tank Tops", "Limited Edition", "Accessories"];

export default function AdminCategories() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();
  const upsert = useUpsertCategory();
  const archiveMut = useArchiveCategory();
  const deleteMut = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const productCount = (categoryName: string) =>
    (products as any[]).filter((p) => p.category === categoryName).length;

  const openNew = () => { setEditCat({ ...emptyCategory }); setSlugTouched(false); setOpen(true); };
  const openEdit = (cat: any) => { setEditCat({ ...cat }); setSlugTouched(true); setOpen(true); };

  const handleNameChange = (name: string) => {
    setEditCat((prev: any) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, "categories");
      setEditCat((prev: any) => ({ ...prev, image_url: url }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (status: string) => {
    if (!editCat.name.trim()) { toast.error("Category name is required"); return; }
    if (!editCat.slug.trim()) { toast.error("Slug is required"); return; }
    if (!editCat.image_url && status !== "draft") { toast.error("An image is required before publishing"); return; }
    try {
      const wasLive = editCat.status === "live";
      const goingLive = status === "live";
      const payload = {
        ...editCat,
        status,
        // Stamp launched_at the moment a category first becomes Live, so the
        // "New" badge has a starting point. Never overwritten on later saves.
        launched_at: goingLive && !wasLive ? new Date().toISOString() : editCat.launched_at,
      };
      await upsert.mutateAsync(payload);
      toast.success(
        status === "draft" ? "Saved as draft" :
        status === "coming_soon" ? "Published as Coming Soon" :
        status === "live" ? "Category is now Live 🎉" : "Saved"
      );
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleArchive = async () => {
    if (!archiveId) return;
    try {
      await archiveMut.mutateAsync(archiveId);
      toast.success("Category archived — hidden everywhere, data kept");
      setArchiveId(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRestore = async (cat: any) => {
    try {
      await upsert.mutateAsync({ ...cat, status: "live" });
      toast.success("Category restored");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success("Category permanently deleted");
      setDeleteId(null);
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return <div className="font-serif text-muted-foreground p-8">Loading...</div>;

  const sorted = [...(categories as any[])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-black text-foreground">Categories</h1>
          <p className="font-serif text-sm text-muted-foreground mt-1">
            New categories automatically appear on the home page grid, the burger menu, the Category picker when
            creating a product, and in Inventory — no code changes needed.
          </p>
        </div>
        <Button onClick={openNew} className="font-serif gap-2">
          <Plus className="h-4 w-4" /> Add New Category
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map((cat: any) => {
          const meta = STATUS_META[cat.status] || STATUS_META.draft;
          const count = productCount(cat.name);
          const isNew = getShowNewBadge(cat);
          return (
            <div key={cat.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-serif font-bold text-foreground">{cat.name}</p>
                  {cat.is_legacy && (
                    <span className="font-serif text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      built-in page
                    </span>
                  )}
                  {isNew && (
                    <span className="font-serif text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                      NEW
                    </span>
                  )}
                  <span className={`font-serif text-[10px] px-2 py-0.5 rounded-full font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="font-serif text-xs text-muted-foreground mt-0.5">
                  /{cat.slug} · {cat.category_type} · {count} product{count === 1 ? "" : "s"} · order {cat.display_order}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {cat.status === "coming_soon" && (
                  <Button size="sm" onClick={() => upsert.mutateAsync({ ...cat, status: "live", launched_at: new Date().toISOString() }).then(() => toast.success("Launched! 🎉"))} className="font-serif gap-1.5">
                    <Rocket className="h-3.5 w-3.5" /> Launch Now
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(cat)} className="font-serif gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {cat.status === "archived" ? (
                  <Button size="sm" variant="outline" onClick={() => handleRestore(cat)} className="font-serif gap-1.5">
                    <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setArchiveId(cat.id)} className="font-serif gap-1.5 text-muted-foreground">
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setDeleteId(cat.id)} className="font-serif gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-serif">No categories yet.</div>
        )}
      </div>

      {/* ── Add / Edit dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editCat?.id ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>

          {editCat && (
            <div className="space-y-4">
              {editCat.is_legacy && (
                <p className="font-serif text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  This category runs on its own built-in page ({editCat.legacy_href}), so its name, slug, and type are
                  locked. You can still update its image, order, and status.
                </p>
              )}

              <div>
                <Label className="font-serif text-xs">Category Name</Label>
                <Input
                  value={editCat.name}
                  disabled={editCat.is_legacy}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Beaded Bags"
                  className="font-serif mt-1"
                />
              </div>

              <div>
                <Label className="font-serif text-xs">Slug (used in the URL)</Label>
                <Input
                  value={editCat.slug}
                  disabled={editCat.is_legacy}
                  onChange={(e) => { setSlugTouched(true); setEditCat((p: any) => ({ ...p, slug: slugify(e.target.value) })); }}
                  placeholder="e.g. beaded-bags"
                  className="font-serif mt-1"
                />
                {!editCat.is_legacy && (
                  <p className="font-serif text-[10px] text-muted-foreground mt-1">
                    Page will live at /category/{editCat.slug || "…"}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-serif text-xs">Category Type</Label>
                <Select
                  value={editCat.category_type}
                  disabled={editCat.is_legacy}
                  onValueChange={(v) => setEditCat((p: any) => ({ ...p, category_type: v }))}
                >
                  <SelectTrigger className="font-serif mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wearable" className="font-serif">Wearable (sizes, tee/tank-style customization)</SelectItem>
                    <SelectItem value="accessory" className="font-serif">Accessory (variant-style customization)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="font-serif text-[10px] text-muted-foreground mt-1">
                  Determines which customization template products in this category get — no extra setup per product.
                </p>
              </div>

              <div>
                <Label className="font-serif text-xs">Description (optional)</Label>
                <Textarea
                  value={editCat.description || ""}
                  onChange={(e) => setEditCat((p: any) => ({ ...p, description: e.target.value }))}
                  placeholder="Shown under the tile on the home page"
                  className="font-serif mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label className="font-serif text-xs">Category Image</Label>
                <div className="flex items-center gap-3 mt-1">
                  {editCat.image_url && (
                    <img src={editCat.image_url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                  )}
                  <label className="cursor-pointer">
                    <Button asChild type="button" variant="outline" disabled={uploading} size="sm" className="font-serif">
                      <span>{uploading ? "Uploading..." : editCat.image_url ? "Replace Image" : "Upload Image"}</span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-serif text-xs">Display Order (home grid)</Label>
                  <Input
                    type="number"
                    value={editCat.display_order}
                    onChange={(e) => setEditCat((p: any) => ({ ...p, display_order: Number(e.target.value) }))}
                    className="font-serif mt-1"
                  />
                </div>
                <div>
                  <Label className="font-serif text-xs">Menu Order (optional)</Label>
                  <Input
                    type="number"
                    value={editCat.menu_order ?? ""}
                    placeholder="same as display order"
                    onChange={(e) => setEditCat((p: any) => ({ ...p, menu_order: e.target.value === "" ? null : Number(e.target.value) }))}
                    className="font-serif mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="font-serif text-xs">"New" Badge</Label>
                <Select
                  value={editCat.force_new_badge === true ? "on" : editCat.force_new_badge === false ? "off" : "auto"}
                  onValueChange={(v) => setEditCat((p: any) => ({ ...p, force_new_badge: v === "on" ? true : v === "off" ? false : null }))}
                >
                  <SelectTrigger className="font-serif mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="font-serif">Automatic — show for 14 days after launch</SelectItem>
                    <SelectItem value="on" className="font-serif">Always show</SelectItem>
                    <SelectItem value="off" className="font-serif">Never show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2 mt-2">
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => save("draft")} className="font-serif flex-1">
                Save as Draft
              </Button>
              <Button variant="outline" onClick={() => save("coming_soon")} className="font-serif flex-1">
                Publish as Coming Soon
              </Button>
            </div>
            <Button onClick={() => save("live")} className="font-serif w-full gap-1.5">
              <Rocket className="h-4 w-4" /> {editCat?.status === "live" ? "Save" : "Launch Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Archive confirm ── */}
      <AlertDialog open={!!archiveId} onOpenChange={(o) => !o && setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Archive this category?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif space-y-2" asChild>
              <div>
                <p>
                  It'll disappear from the home page, burger menu, Category picker, search, Sale, Best Sellers, and
                  Admin Products/Inventory — but nothing is deleted. Any products still tagged with it keep their
                  data, and you can restore this category anytime.
                </p>
                {(() => {
                  const cat = sorted.find((c: any) => c.id === archiveId);
                  if (cat && HARDCODED_ADMIN_SECTIONS.includes(cat.name)) {
                    return (
                      <p className="text-amber-700 font-bold">
                        "{cat.name}" is one of the site's built-in categories — its {cat.legacy_href} page will keep
                        existing at that URL, it just won't be linked from anywhere until restored.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} className="font-serif bg-destructive text-destructive-foreground hover:bg-destructive/90">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Hard delete confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Permanently delete this category?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif space-y-2" asChild>
              <div>
                <p>This can't be undone.</p>
                {(() => {
                  const cat = sorted.find((c: any) => c.id === deleteId);
                  if (!cat) return null;
                  const count = productCount(cat.name);
                  return (
                    <>
                      {count > 0 && (
                        <p className="text-destructive font-bold">
                          {count} product{count === 1 ? "" : "s"} still tagged "{cat.name}" won't be deleted, but
                          they'll disappear from the storefront, search, sale, best sellers, and Admin Products/Inventory
                          until re-categorized.
                        </p>
                      )}
                      {HARDCODED_ADMIN_SECTIONS.includes(cat.name) && (
                        <p className="text-amber-700 font-bold">
                          "{cat.name}" is one of the site's built-in categories — its {cat.legacy_href} page will keep
                          existing, but it'll disappear from the home page, menu, and admin sections.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </AlertDialogDescription>
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
