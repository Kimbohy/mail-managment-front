import { Inbox, Mail, Send, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageListItem } from "./message-list-item";
import type { MailSummary } from "@/api/mail";
import type { BoxType } from "@/lib/nuqs-parser";

interface MessageListProps {
  currentMailbox: BoxType;
  onMailboxChange: (mailbox: BoxType) => void;
  messages: MailSummary[];
  selectedId: string | null;
  onSelectMessage: (id: string) => void;
  loading: boolean;
  unreadCount: number;
}

export function MessageList({
  currentMailbox,
  onMailboxChange,
  messages,
  selectedId,
  onSelectMessage,
  loading,
  unreadCount,
}: MessageListProps) {
  const getEmptyMessage = () => {
    switch (currentMailbox) {
      case "INBOX":
        return "No messages in your inbox";
      case "SENT":
        return "No sent messages";
      case "TRASH":
        return "No messages in trash";
      default:
        return "No messages";
    }
  };

  const isTrashView = currentMailbox === "TRASH";

  return (
    <aside className="flex w-full md:w-80 flex-col border-r bg-background h-full overflow-hidden">
      {isTrashView ? (
        // Trash View - Show only trash with back button
        <div className="flex flex-col h-full">
          <div className="border-b px-3 md:px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMailboxChange("INBOX")}
                className="shrink-0"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <Trash2 className="size-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Trash</h2>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {loading && messages.length === 0 ? (
              <div className="space-y-2 p-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Mail className="mb-4 size-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {getEmptyMessage()}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2 w-full">
                {messages.map((message) => (
                  <MessageListItem
                    key={message.id}
                    message={message}
                    selected={message.id === selectedId}
                    onSelect={() => onSelectMessage(message.id)}
                    isSent={false}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3 shrink-0">
            <div className="text-xs text-muted-foreground">
              {messages.length} message{messages.length === 1 ? "" : "s"} total
            </div>
          </div>
        </div>
      ) : (
        // Normal View - Show Inbox and Sent tabs
        <Tabs
          value={currentMailbox}
          onValueChange={(value) => onMailboxChange(value as BoxType)}
          className="flex flex-col h-full"
        >
          <div className="border-b px-3 md:px-4 py-3 shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="INBOX" className="gap-2 text-xs md:text-sm">
                <Inbox className="size-3 md:size-4" />
                <span className="hidden sm:inline">Inbox</span>
                <span className="sm:hidden">In</span>
                {currentMailbox === "INBOX" && unreadCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 px-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="SENT" className="gap-2 text-xs md:text-sm">
                <Send className="size-3 md:size-4" />
                <span className="hidden sm:inline">Sent</span>
                <span className="sm:hidden">Snt</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {loading && messages.length === 0 ? (
              <div className="space-y-2 p-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Mail className="mb-4 size-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {getEmptyMessage()}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2 w-full">
                {messages.map((message) => (
                  <MessageListItem
                    key={message.id}
                    message={message}
                    selected={message.id === selectedId}
                    onSelect={() => onSelectMessage(message.id)}
                    isSent={currentMailbox === "SENT"}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3 shrink-0">
            <div className="text-xs text-muted-foreground">
              {messages.length} message{messages.length === 1 ? "" : "s"} total
            </div>
          </div>
        </Tabs>
      )}
    </aside>
  );
}
