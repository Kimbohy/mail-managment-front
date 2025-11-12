import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DeleteMessageDialog({
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  handleDeleteConfirm,
  isTrash = false,
}: {
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  handleDeleteConfirm: () => void;
  isTrash?: boolean;
}) {
  return (
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isTrash ? "Delete Permanently?" : "Move to Trash?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isTrash
              ? "This message will be permanently deleted and cannot be recovered."
              : "This message will be moved to trash. You can restore it later if needed."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm}>
            {isTrash ? "Delete Permanently" : "Move to Trash"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
