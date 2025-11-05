import { type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ComposeDraft {
  to: string;
  subject: string;
  body: string;
}

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ComposeDraft;
  onDraftChange: (field: keyof ComposeDraft, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sending: boolean;
  userEmail: string;
}

export function ComposeDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSubmit,
  sending,
  userEmail,
}: ComposeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Compose and send an email from {userEmail}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compose-to">To</Label>
            <Input
              id="compose-to"
              type="email"
              value={draft.to}
              onChange={(e) => onDraftChange("to", e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              value={draft.subject}
              onChange={(e) => onDraftChange("subject", e.target.value)}
              placeholder="Message subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              rows={8}
              value={draft.body}
              onChange={(e) => onDraftChange("body", e.target.value)}
              placeholder="Write your message here..."
              className="resize-none min-h-[200px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="gap-2 w-full sm:w-auto"
            >
              <Send className="size-4" />
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
