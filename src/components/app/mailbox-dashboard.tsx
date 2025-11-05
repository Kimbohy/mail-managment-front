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
  Edit3,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { handleApiFailure } from "@/lib/mail-utils";
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
import { MessageList } from "./message-list";
import { MessageViewer } from "./message-viewer";
import { ComposeDialog, type ComposeDraft } from "./compose-dialog";

interface MailboxDashboardProps {
  session: SessionInfo;
  onLogout: () => Promise<void>;
  onSessionExpired: () => void;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>

            <Mail className="size-5 md:size-6 text-primary" />
            <h1 className="text-base md:text-lg font-semibold">Mail Manager</h1>
            <Separator orientation="vertical" className="hidden md:block h-6" />
            <span className="hidden md:inline text-sm text-muted-foreground">
              {session.email}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
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
                  <span className="hidden sm:inline">Compose</span>
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
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar - hidden on mobile, overlay on tablet, normal on desktop */}
          <div
            className={cn(
              "absolute md:relative inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <MessageList
              currentMailbox={currentMailbox}
              onMailboxChange={(mailbox) => {
                setCurrentMailbox(mailbox);
                setSelectedId(null);
                setDetail(null);
              }}
              messages={messages}
              selectedId={selectedId}
              onSelectMessage={(id) => {
                setSelectedId(id);
                setSidebarOpen(false);
              }}
              loading={listLoading}
              unreadCount={unreadCount}
            />
          </div>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="absolute inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="flex flex-1 flex-col">
            <MessageViewer
              detail={detail}
              loading={detailLoading}
              selectedId={selectedId}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          </main>
        </div>

        <ComposeDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
          draft={composeDraft}
          onDraftChange={handleDraftChange}
          onSubmit={handleSend}
          sending={sending}
          userEmail={session.email}
        />
      </div>
    </TooltipProvider>
  );
}
