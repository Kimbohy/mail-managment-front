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
  Menu,
  X,
  Search,
  Filter,
  User,
  Moon,
  Sun,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { resolveErrorMessage } from "@/lib/api-errors";
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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

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
  const [logoutPending, setLogoutPending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft>({
    to: "",
    subject: "",
    body: "",
  });

  const sessionId = session.sessionId;
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (mobileSearchOpen) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [mobileSearchOpen]);

  const refreshMessages = useCallback(async () => {
    setListLoading(true);
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
      toast.error(resolveErrorMessage(error));
      if (error instanceof Error && error.message.includes("401")) {
        onSessionExpired();
      }
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
        toast.error(resolveErrorMessage(error));
        if (error instanceof Error && error.message.includes("401")) {
          onSessionExpired();
        }
      })
      .finally(() => setDetailLoading(false));
  }, [sessionId, selectedId, onSessionExpired, currentMailbox]);

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.seen).length,
    [messages]
  );

  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (message) =>
          message.from?.toLowerCase().includes(query) ||
          message.to?.toLowerCase().includes(query) ||
          message.subject?.toLowerCase().includes(query) ||
          message.snippet?.toLowerCase().includes(query)
      );
    }

    // Filter by unread status
    if (showUnreadOnly) {
      filtered = filtered.filter((message) => !message.seen);
    }

    return filtered;
  }, [messages, searchQuery, showUnreadOnly]);

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
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error(resolveErrorMessage(error));
      if (error instanceof Error && error.message.includes("401")) {
        onSessionExpired();
      }
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
      void refreshMessages();
    } catch (error) {
      toast.error(resolveErrorMessage(error));
      if (error instanceof Error && error.message.includes("401")) {
        onSessionExpired();
      }
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
        <header className="flex flex-col border-b">
          <div className="flex h-14 items-center justify-between px-4">
            {/* Mobile: Expandable Search UI */}
            {mobileSearchOpen ? (
              <div className="flex items-center gap-2 w-full md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="size-5" />
                </Button>
                <InputGroup className="flex-1">
                  <InputGroupAddon>
                    <Search className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="search"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </InputGroup>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={showUnreadOnly}
                      onCheckedChange={setShowUnreadOnly}
                    >
                      Unread only
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                {/* Mobile: Normal Layout (collapsed search) */}
                <div className="flex items-center gap-2 md:gap-3">
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
                  <h1 className="text-base md:text-lg font-semibold">
                    Mail Manager
                  </h1>
                  <Separator
                    orientation="vertical"
                    className="hidden md:block h-6"
                  />
                  <span className="hidden md:inline text-sm text-muted-foreground">
                    {session.email}
                  </span>
                </div>

                {/* Desktop: Full Search Bar */}
                <div className="hidden md:flex items-center gap-2 flex-1 justify-center px-4 max-w-2xl">
                  <InputGroup className="w-full max-w-md">
                    <InputGroupAddon>
                      <Search className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="search"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0"
                      >
                        <Filter className="size-4" />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={showUnreadOnly}
                        onCheckedChange={setShowUnreadOnly}
                      >
                        Unread only
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {(searchQuery || showUnreadOnly) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setShowUnreadOnly(false);
                      }}
                      className="text-xs shrink-0"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  {/* Mobile search button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileSearchOpen(true)}
                  >
                    <Search className="size-5" />
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void refreshMessages()}
                        disabled={listLoading}
                      >
                        <RefreshCw
                          className={cn(
                            "size-4",
                            listLoading && "animate-spin"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh inbox</TooltipContent>
                  </Tooltip>

                  <div className="hidden md:block">
                    <ThemeToggle />
                  </div>

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
                    <TooltipContent>Compose new email</TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{session.email}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const newTheme =
                            theme === "system"
                              ? window.matchMedia(
                                  "(prefers-color-scheme: dark)"
                                ).matches
                                ? "light"
                                : "dark"
                              : theme === "dark"
                              ? "light"
                              : "dark";
                          setTheme(newTheme);
                        }}
                        className="md:hidden"
                      >
                        {theme === "dark" ||
                        (theme === "system" &&
                          window.matchMedia("(prefers-color-scheme: dark)")
                            .matches) ? (
                          <>
                            <Sun className="mr-2 size-4" />
                            Light mode
                          </>
                        ) : (
                          <>
                            <Moon className="mr-2 size-4" />
                            Dark mode
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="md:hidden" />
                      <DropdownMenuItem
                        onClick={() => void handleLogoutClick()}
                        disabled={logoutPending}
                      >
                        <LogOut className="mr-2 size-4" />
                        {logoutPending ? "Logging out..." : "Logout"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </header>

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
              messages={filteredMessages}
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
              onDelete={handleDeleteClick}
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

        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
