import { useState } from "react";
import { toast } from "sonner";
import { deleteMessage, restoreMessage } from "@/api/mail";
import { resolveErrorMessage } from "@/lib/api-errors";
import type { BoxType } from "@/lib/nuqs-parser";
import type { MailSummary, MailDetail } from "@/api/mail";

interface UseMessageDeleteOptions {
  sessionId: string;
  currentMailbox: BoxType;
  setMessages: React.Dispatch<React.SetStateAction<MailSummary[]>>;
  setSelectedId: (id: string | null) => void;
  setDetail: React.Dispatch<React.SetStateAction<MailDetail | null>>;
  onSessionExpired: () => void;
}

export function useMessageDelete({
  sessionId,
  currentMailbox,
  setMessages,
  setSelectedId,
  setDetail,
  onSessionExpired,
}: UseMessageDeleteOptions) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setMessageToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    const id = messageToDelete;
    setDeleteConfirmOpen(false);
    setMessageToDelete(null);
    setDeletingId(id);

    try {
      await deleteMessage(sessionId, id, currentMailbox);
      setMessages((current) => {
        const nextMessages = current.filter((message) => message.id !== id);
        const currentIndex = current.findIndex((message) => message.id === id);

        // Determine next selected message
        if (nextMessages.length === 0) {
          setSelectedId(null);
        } else {
          const nextIndex = Math.min(currentIndex, nextMessages.length - 1);
          setSelectedId(nextMessages[nextIndex]!.id);
        }

        return nextMessages;
      });
      setDetail((currentDetail) =>
        currentDetail && currentDetail.id === id ? null : currentDetail
      );

      const message =
        currentMailbox === "TRASH"
          ? "Message deleted permanently"
          : "Message moved to trash";
      toast.success(message);
    } catch (error) {
      toast.error(resolveErrorMessage(error));
      if (error instanceof Error && error.message.includes("401")) {
        onSessionExpired();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);

    try {
      // Restore to INBOX by default
      await restoreMessage(sessionId, id, "INBOX");

      setMessages((current) => {
        const nextMessages = current.filter((message) => message.id !== id);
        const currentIndex = current.findIndex((message) => message.id === id);

        // Determine next selected message
        if (nextMessages.length === 0) {
          setSelectedId(null);
        } else {
          const nextIndex = Math.min(currentIndex, nextMessages.length - 1);
          setSelectedId(nextMessages[nextIndex]!.id);
        }

        return nextMessages;
      });
      setDetail((currentDetail) =>
        currentDetail && currentDetail.id === id ? null : currentDetail
      );

      toast.success("Message restored to inbox");
    } catch (error) {
      toast.error(resolveErrorMessage(error));
      if (error instanceof Error && error.message.includes("401")) {
        onSessionExpired();
      }
    } finally {
      setRestoringId(null);
    }
  };

  return {
    deletingId,
    restoringId,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleDeleteClick,
    handleDeleteConfirm,
    handleRestore,
  };
}
