import { Clock, Mail, Trash2, RotateCcw } from "lucide-react";
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
import {
  createAvatarFallback,
  formatDisplayDate,
  formatSubject,
} from "@/lib/mail-utils";
import type { MailDetail } from "@/api/mail";
import { formatDisplayName } from "../../lib/mail-utils";

interface MessageViewerProps {
  detail: MailDetail | null;
  loading: boolean;
  selectedId: string | null;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  isTrash?: boolean;
  restoringId?: string | null;
}

export function MessageViewer({
  detail,
  loading,
  selectedId,
  deletingId,
  onDelete,
  onRestore,
  isTrash = false,
  restoringId,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b px-4 md:px-6 py-3 md:py-4 gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Avatar className="size-8 md:size-10 shrink-0">
            <AvatarFallback>
              {createAvatarFallback(formatDisplayName(detail.from))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm md:text-base truncate">
              {formatSubject(detail.subject)}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {detail.from || "Unknown sender"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span className="hidden sm:inline">
              {formatDisplayDate(detail.date)}
            </span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          {isTrash ? (
            <>
              {onRestore && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => selectedId && onRestore(selectedId)}
                      disabled={restoringId === selectedId}
                    >
                      <RotateCcw className="size-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restore message</TooltipContent>
                </Tooltip>
              )}
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
                <TooltipContent>Delete permanently</TooltipContent>
              </Tooltip>
            </>
          ) : (
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
              <TooltipContent>Move to trash</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          <div className="mb-4 rounded-lg bg-muted/50 p-3 text-xs md:text-sm">
            <div className="grid gap-1">
              <div className="flex gap-2">
                <span className="font-medium shrink-0">From:</span>
                <span className="text-muted-foreground truncate">
                  {detail.from || "Unknown"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium shrink-0">To:</span>
                <span className="text-muted-foreground truncate">
                  {detail.to || "Unknown"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium shrink-0">Date:</span>
                <span className="text-muted-foreground">
                  {formatDisplayDate(detail.date)}
                </span>
              </div>
            </div>
          </div>

          {detail.text ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm leading-relaxed">
                {detail.text}
              </pre>
            </div>
          ) : detail.html ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: detail.html }}
            />
          ) : detail.snippet ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm leading-relaxed">
                {detail.snippet}
              </pre>
            </div>
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
