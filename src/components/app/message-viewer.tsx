import { Clock, Mail, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createAvatarFallback, formatDisplayDate } from "@/lib/mail-utils";
import type { MailDetail } from "@/api/mail";

interface MessageViewerProps {
  detail: MailDetail | null;
  loading: boolean;
  selectedId: string | null;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

export function MessageViewer({
  detail,
  loading,
  selectedId,
  deletingId,
  onDelete,
}: MessageViewerProps) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!selectedId || !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <Mail className="mb-4 size-16 text-muted-foreground/30" />
        <h3 className="mb-2 text-lg font-medium">No message selected</h3>
        <p className="text-sm text-muted-foreground">
          Choose a message from your inbox to read
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{createAvatarFallback(detail.from)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">
              {detail.subject || "(No subject)"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {detail.from || "Unknown sender"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatDisplayDate(detail.date)}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => selectedId && onDelete(selectedId)}
                disabled={deletingId === selectedId}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete message</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="grid gap-1">
              <div className="flex gap-2">
                <span className="font-medium">From:</span>
                <span className="text-muted-foreground">
                  {detail.from || "Unknown"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium">To:</span>
                <span className="text-muted-foreground">
                  {detail.to || "Unknown"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium">Date:</span>
                <span className="text-muted-foreground">
                  {formatDisplayDate(detail.date)}
                </span>
              </div>
            </div>
          </div>

          {detail.snippet ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {detail.snippet}
              </pre>
            </div>
          ) : detail.html ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: detail.html }}
            />
          ) : (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
              No message content available
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
