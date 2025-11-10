import { Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createAvatarFallback, formatDisplayDate } from "@/lib/mail-utils";
import type { MailSummary } from "@/api/mail";

interface MessageListItemProps {
  message: MailSummary;
  selected: boolean;
  onSelect: () => void;
  isSent: boolean;
}

export function MessageListItem({
  message,
  selected,
  onSelect,
  isSent,
}: MessageListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg p-3 text-left transition-colors",
        selected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50",
        !message.seen && "font-medium"
      )}
    >
      <div className="flex items-start gap-3 w-full">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="text-xs">
            {isSent
              ? createAvatarFallback(message.to)
              : createAvatarFallback(message.from)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">
              {isSent
                ? message.to || "Unknown recipient"
                : message.from || "Unknown sender"}
            </p>
            {!message.seen && (
              <Badge variant="default" className="shrink-0 text-xs">
                New
              </Badge>
            )}
          </div>

          <p className="truncate text-sm font-medium text-foreground">
            {message.subject || "(No subject)"}
          </p>

          <p className="line-clamp-2 text-xs text-muted-foreground">
            {message.snippet || "No preview available"}
          </p>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {formatDisplayDate(message.date)}
          </div>
        </div>
      </div>
    </button>
  );
}
