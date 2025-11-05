import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Mail,
  RefreshCw,
  LogOut,
  Send,
  Trash2,
  Edit3,
  Inbox,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isApiError, resolveErrorMessage } from "@/lib/api-errors";
import type { SessionInfo } from "@/api/auth";
import {
  deleteMessage,
  getMessage,
  listMessages,
  sendMail,
  type MailDetail,
  type MailSummary,
  type SendMailPayload,
} from "@/api/mail";

interface MailboxDashboardProps {
  session: SessionInfo;
  onLogout: () => Promise<void>;
  onSessionExpired: () => void;
}

interface ComposeDraft {
  to: string;
  subject: string;
  body: string;
}

export function MailboxDashboard({
  session,
  onLogout,
  onSessionExpired,
}: MailboxDashboardProps) {
  const [currentMailbox, setCurrentMailbox] = useState<"INBOX" | "Sent">(
    "INBOX"
  );
  const [messages, setMessages] = useState<MailSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MailDetail | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft>({
    to: "",
    subject: "",
    body: "",
  });

  const sessionId = session.sessionId;

  const refreshMessages = useCallback(async () => {
    setListLoading(true);
    setActionError(null);
    try {
      const data = await listMessages(sessionId, currentMailbox);
      setMessages(data);
      setSelectedId((current) => {
        if (data.length === 0) {
          return null;
        }
        if (current && data.some((item) => item.id === current)) {
          return current;
        }
        return data[0]?.id ?? null;
      });
    } catch (error) {
      handleApiFailure(error, onSessionExpired, setActionError);
    } finally {
      setListLoading(false);
    }
  }, [onSessionExpired, sessionId, currentMailbox]);

  useEffect(() => {
    void refreshMessages();
  }, [refreshMessages]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetail(null);
    setDetailLoading(true);
    setActionError(null);
    getMessage(sessionId, selectedId, currentMailbox)
      .then((message) => {
        setDetail(message);
        setMessages((current) =>
          current.map((item) =>
            item.id === message.id ? { ...item, seen: true } : item
          )
        );
      })
      .catch((error) => {
        handleApiFailure(error, onSessionExpired, setActionError);
      })
      .finally(() => setDetailLoading(false));
  }, [sessionId, selectedId, onSessionExpired, currentMailbox]);

  useEffect(() => {
    if (!infoMessage) {
      return;
    }
    const timer = window.setTimeout(() => setInfoMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [infoMessage]);

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.seen).length,
    [messages]
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setActionError(null);
    try {
      await deleteMessage(sessionId, id, currentMailbox);
      setMessages((current) => {
        const nextMessages = current.filter((message) => message.id !== id);
        const currentIndex = current.findIndex((message) => message.id === id);
        setSelectedId((currentSelected) => {
          if (currentSelected !== id) {
            return currentSelected;
          }
          if (nextMessages.length === 0) {
            return null;
          }
          const nextIndex = Math.min(currentIndex, nextMessages.length - 1);
          return nextMessages[nextIndex]!.id;
        });
        return nextMessages;
      });
      setDetail((currentDetail) =>
        currentDetail && currentDetail.id === id ? null : currentDetail
      );
      setInfoMessage("Message deleted successfully");
    } catch (error) {
      handleApiFailure(error, onSessionExpired, setActionError);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) {
      return;
    }
    if (!composeDraft.to || !composeDraft.subject) {
      setActionError("Recipient and subject are required.");
      return;
    }
    setSending(true);
    setActionError(null);
    try {
      const payload: SendMailPayload = {
        to: composeDraft.to,
        subject: composeDraft.subject,
        text: composeDraft.body,
      };
      await sendMail(sessionId, payload);
      setInfoMessage("Email sent successfully");
      setComposeDraft({ to: "", subject: "", body: "" });
      setComposeOpen(false);
      void refreshMessages();
    } catch (error) {
      handleApiFailure(error, onSessionExpired, setActionError);
    } finally {
      setSending(false);
    }
  };

  const handleLogoutClick = async () => {
    setLogoutPending(true);
    await onLogout();
    setLogoutPending(false);
  };

  const handleDraftChange = (field: keyof ComposeDraft, value: string) => {
    setComposeDraft((draft) => ({ ...draft, [field]: value }));
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Top Navigation Bar */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <Mail className="size-6 text-primary" />
            <h1 className="text-lg font-semibold">Mail Manager</h1>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">
              {session.email}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void refreshMessages()}
                  disabled={listLoading}
                >
                  <RefreshCw
                    className={cn("size-4", listLoading && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh inbox</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setComposeOpen(true)}
                  className="gap-2"
                >
                  <Edit3 className="size-4" />
                  Compose
                </Button>
              </TooltipTrigger>
              <TooltipContent>New message</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="size-8">
                    <AvatarFallback>
                      {session.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex flex-col gap-1 px-2 py-1.5">
                  <p className="text-sm font-medium">{session.email}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogoutClick}
                  disabled={logoutPending}
                  className="gap-2"
                >
                  <LogOut className="size-4" />
                  {logoutPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Alert notifications */}
        {(actionError || infoMessage) && (
          <div className="px-4 pt-4">
            {actionError && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="size-4" />
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}
            {infoMessage && (
              <Alert className="mb-3 border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
                <CheckCircle2 className="size-4" />
                <AlertDescription>{infoMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Message list sidebar */}
          <aside className="flex w-80 flex-col border-r">
            <Tabs
              value={currentMailbox}
              onValueChange={(value) => {
                setCurrentMailbox(value as "INBOX" | "Sent");
                setSelectedId(null);
                setDetail(null);
              }}
              className="flex flex-col flex-1"
            >
              <div className="border-b px-4 py-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="INBOX" className="gap-2">
                    <Inbox className="size-4" />
                    Inbox
                    {currentMailbox === "INBOX" && unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1 h-5 px-1 text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="Sent" className="gap-2">
                    <Send className="size-4" />
                    Sent
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                {listLoading && messages.length === 0 ? (
                  <div className="space-y-2 p-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Mail className="mb-4 size-12 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {currentMailbox === "INBOX"
                        ? "No messages in your inbox"
                        : "No sent messages"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {messages.map((message) => (
                      <MessageListItem
                        key={message.id}
                        message={message}
                        selected={message.id === selectedId}
                        onSelect={() => setSelectedId(message.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t p-3">
                <div className="text-xs text-muted-foreground">
                  {messages.length} message{messages.length === 1 ? "" : "s"}{" "}
                  total
                </div>
              </div>
            </Tabs>
          </aside>

          {/* Message viewer */}
          <main className="flex flex-1 flex-col">
            {detailLoading ? (
              <div className="flex flex-1 flex-col gap-4 p-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : !selectedId || !detail ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <Mail className="mb-4 size-16 text-muted-foreground/30" />
                <h3 className="mb-2 text-lg font-medium">
                  No message selected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a message from your inbox to read
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback>
                        {createAvatarFallback(detail.from)}
                      </AvatarFallback>
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
                          onClick={() =>
                            selectedId && void handleDelete(selectedId)
                          }
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
            )}
          </main>
        </div>

        {/* Compose dialog */}
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Compose and send an email from {session.email}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="compose-to">To</Label>
                <Input
                  id="compose-to"
                  type="email"
                  value={composeDraft.to}
                  onChange={(e) => handleDraftChange("to", e.target.value)}
                  placeholder="recipient@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compose-subject">Subject</Label>
                <Input
                  id="compose-subject"
                  value={composeDraft.subject}
                  onChange={(e) => handleDraftChange("subject", e.target.value)}
                  placeholder="Message subject"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compose-body">Message</Label>
                <Textarea
                  id="compose-body"
                  rows={12}
                  value={composeDraft.body}
                  onChange={(e) => handleDraftChange("body", e.target.value)}
                  placeholder="Write your message here..."
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setComposeOpen(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={sending} className="gap-2">
                  <Send className="size-4" />
                  {sending ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

interface MessageListItemProps {
  message: MailSummary;
  selected: boolean;
  onSelect: () => void;
}

function MessageListItem({
  message,
  selected,
  onSelect,
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
      <div className="flex items-start gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="text-xs">
            {createAvatarFallback(message.from)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">
              {message.from || "Unknown sender"}
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

function createAvatarFallback(from: string | null | undefined) {
  if (!from) {
    return "?";
  }
  const parts = from
    .replace(/\d/g, "")
    .split(/[\s@.,]+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`
    .trim()
    .toUpperCase();
}

function formatDisplayDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (hours < 168) {
    return date.toLocaleDateString([], {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function handleApiFailure(
  error: unknown,
  onSessionExpired: () => void,
  setMessage: (message: string) => void
) {
  if (isApiError(error) && error.status === 401) {
    onSessionExpired();
    return;
  }
  setMessage(resolveErrorMessage(error));
}
