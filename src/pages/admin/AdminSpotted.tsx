import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSpottedImages, useUpsertSpottedImage, useDeleteSpottedImage, uploadFile } from "@/hooks/useAdminData";

export default function AdminSpotted() {
  const { data: images = [], isLoading } = useSpottedImages();
  const upsert = useUpsertSpottedImage();
  const deleteMut = useDeleteSpottedImage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], "spotted");
        await upsert.mutateAsync({ image: url, display_order: images.length + i + 1 });
      }
      toast.success(`${files.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success("Image deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return <div className="font-serif text-muted-foreground p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-foreground">Spotted in Soléa</h1>
        <label className="cursor-pointer">
          <Button asChild disabled={uploading} className="font-serif gap-2">
            <span>
              <Plus className="h-4 w-4" /> {uploading ? "Uploading..." : "Add Photos"}
            </span>
          </Button>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <p className="font-serif text-sm text-muted-foreground">
        These images appear in the "Spotted in soléa" carousel on the homepage. They display in the order shown below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((img: any, idx: number) => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border bg-card">
            <img src={img.image} alt={`spotted-${idx + 1}`} className="w-full h-[180px] object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <button
                onClick={() => setDeleteId(img.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 bg-destructive rounded-full flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-black/50 text-white font-serif text-xs px-2 py-0.5 rounded">
              #{idx + 1}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-serif">
          No images yet. Upload some community photos!
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">This photo will be removed from the homepage carousel.</AlertDialogDescription>
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
