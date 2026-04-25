import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useReviews, useUpsertReview, useDeleteReview } from "@/hooks/useAdminData";

const emptyReview = { review_text: "", customer_name: "Customer", stars: 5, display_order: 0 };

export default function AdminReviews() {
  const { data: reviews = [], isLoading } = useReviews();
  const upsert = useUpsertReview();
  const deleteMut = useDeleteReview();
  const [edit, setEdit] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleNew = () => {
    setEdit({ ...emptyReview, display_order: reviews.length + 1 });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!edit) return;
    try {
      await upsert.mutateAsync({ ...edit, customer_name: edit.customer_name || "Customer" });
      setOpen(false);
      toast.success(edit.id ? "Review updated" : "Review added");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success("Review deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return <div className="font-serif text-muted-foreground p-8">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-black text-foreground">Reviews</h1>
        <Button onClick={handleNew} className="font-serif gap-2">
          <Plus className="h-4 w-4" /> Add Review
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((r: any) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-6 space-y-3 group relative">
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEdit({ ...r }); setOpen(true); }} className="h-7 w-7 bg-secondary rounded-lg flex items-center justify-center hover:bg-accent">
                <Pencil className="h-3 w-3 text-foreground" />
              </button>
              <button onClick={() => setDeleteId(r.id)} className="h-7 w-7 bg-secondary rounded-lg flex items-center justify-center hover:bg-destructive/10">
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
            <p className="font-serif text-sm text-foreground/85 leading-relaxed">"{r.review_text}"</p>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{edit?.id ? "Edit Review" : "Add Review"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="font-serif text-xs">Review Text</Label>
                <Textarea value={edit.review_text} onChange={(e) => setEdit({ ...edit, review_text: e.target.value })} className="font-serif text-sm" rows={5} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="font-serif">Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending} className="font-serif">
              {upsert.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Review?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">This review will be permanently removed from the storefront.</AlertDialogDescription>
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
