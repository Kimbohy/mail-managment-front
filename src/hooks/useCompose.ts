import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { sendMail, type SendMailPayload } from "@/api/mail";
import { resolveErrorMessage } from "@/lib/api-errors";
import type { ComposeDraft } from "@/components/app/compose-dialog";

interface UseComposeOptions {
  sessionId: string;
  onSessionExpired: () => void;
  onSuccess: () => void;
}

export function useCompose({
  sessionId,
  onSessionExpired,
  onSuccess,
}: UseComposeOptions) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft>({
    to: "",
    subject: "",
    body: "",
  });

  const handleDraftChange = (field: keyof ComposeDraft, value: string) => {
    setComposeDraft((draft) => ({ ...draft, [field]: value }));
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) {
      return;
    }
    if (!composeDraft.to || !composeDraft.subject) {
      toast.error("Recipient and subject are required.");
      return;
    }
    setSending(true);
    try {
      const payload: SendMailPayload = {
        to: composeDraft.to,
        subject: composeDraft.subject,
        text: composeDraft.body,
      };
      await sendMail(sessionId, payload);
      toast.success("Email sent successfully");
      setComposeDraft({ to: "", subject: "", body: "" });
      setComposeOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(resolveErrorMessage(error));
      if (error instanceof Error && error.message.includes("401")) {
        onSessionExpired();
      }
    } finally {
      setSending(false);
    }
  };

  return {
    composeOpen,
    setComposeOpen,
    sending,
    composeDraft,
    handleDraftChange,
    handleSend,
  };
}
