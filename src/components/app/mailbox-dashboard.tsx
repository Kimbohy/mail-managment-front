import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
      const data = await listMessages(sessionId);
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
  }, [onSessionExpired, sessionId]);

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
    getMessage(sessionId, selectedId)
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
  }, [sessionId, selectedId, onSessionExpired]);

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
      await deleteMessage(sessionId, id);
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
      setInfoMessage("Message deleted.");
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
      setInfoMessage("Message sent successfully.");
      setComposeDraft((draft) => ({ ...draft, body: "" }));
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
    <div className="flex min-h-screen flex-col bg-muted/30">
      <DashboardHeader
        email={session.email}
        onRefresh={() => void refreshMessages()}
        refreshDisabled={listLoading}
        onLogout={handleLogoutClick}
        logoutPending={logoutPending}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-6">
        <FeedbackAlerts actionError={actionError} infoMessage={infoMessage} />

        <section className="flex flex-1 flex-col gap-5 xl:flex-row">
          <InboxPanel
            messages={messages}
            unreadCount={unreadCount}
            listLoading={listLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <div className="flex flex-1 flex-col gap-5">
            <MessagePanel
              detailLoading={detailLoading}
              selectedId={selectedId}
              detail={detail}
              deletingId={deletingId}
              onDelete={() => selectedId && void handleDelete(selectedId)}
            />

            <ComposerPanel
              draft={composeDraft}
              sending={sending}
              onDraftChange={handleDraftChange}
              onSubmit={handleSend}
              email={session.email}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

interface DashboardHeaderProps {
  email: string;
  onRefresh: () => void;
  refreshDisabled: boolean;
  onLogout: () => Promise<void> | void;
  logoutPending: boolean;
}

function DashboardHeader({
  email,
  onRefresh,
  refreshDisabled,
  onLogout,
  logoutPending,
}: DashboardHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold">Mail Manager</h1>
          <p className="text-sm text-muted-foreground">Connected as {email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={refreshDisabled}
          >
            {refreshDisabled ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onLogout}
            disabled={logoutPending}
          >
            {logoutPending ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </div>
    </header>
  );
}

interface FeedbackAlertsProps {
  actionError: string | null;
  infoMessage: string | null;
}

function FeedbackAlerts({ actionError, infoMessage }: FeedbackAlertsProps) {
  if (!actionError && !infoMessage) {
    return null;
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {infoMessage && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{infoMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface InboxPanelProps {
  messages: MailSummary[];
  unreadCount: number;
  listLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function InboxPanel({
  messages,
  unreadCount,
  listLoading,
  selectedId,
  onSelect,
}: InboxPanelProps) {
  return (
    <Card className="w-full shrink-0 border-border/80 xl:max-w-xs">
      <CardHeader className="px-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Inbox</CardTitle>
            <CardDescription>
              {listLoading
                ? "Updating inbox…"
                : `${messages.length} message${
                    messages.length === 1 ? "" : "s"
                  }`}
            </CardDescription>
          </div>
          <Badge variant={unreadCount ? "default" : "secondary"}>
            {unreadCount} unread
          </Badge>
        </div>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="px-0">
        {listLoading && messages.length === 0 ? (
          <div className="space-y-3 px-6 py-6">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="px-6 py-12 text-sm text-muted-foreground">
            No messages yet. Try refreshing in a moment.
          </div>
        ) : (
          <ScrollArea className="h-[420px] px-1">
            <div className="space-y-2 px-5 py-4">
              {messages.map((message) => (
                <MailListItem
                  key={message.id}
                  message={message}
                  selected={message.id === selectedId}
                  onSelect={() => onSelect(message.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface MessagePanelProps {
  detailLoading: boolean;
  selectedId: string | null;
  detail: MailDetail | null;
  deletingId: string | null;
  onDelete: () => void;
}

function MessagePanel({
  detailLoading,
  selectedId,
  detail,
  deletingId,
  onDelete,
}: MessagePanelProps) {
  return (
    <Card className="flex-1 border-border/80">
      <CardHeader className="gap-2 px-6">
        <CardTitle className="text-lg">Message</CardTitle>
        <CardDescription>
          {selectedId
            ? "Preview the selected message"
            : "Choose a message from the inbox."}
        </CardDescription>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="px-6">
        {detailLoading ? (
          <div className="flex h-64 flex-col gap-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : !selectedId ? (
          <EmptyState message="Select a message to read." />
        ) : !detail ? (
          <EmptyState message="Unable to load the selected message." />
        ) : (
          <article className="space-y-4">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {detail.subject || "(No subject)"}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>From: {detail.from || "Unknown"}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>To: {detail.to || "Unknown"}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{formatDisplayDate(detail.date)}</span>
              </div>
            </div>
            {detail.text ? (
              <ScrollArea className="max-h-[360px] rounded-lg border">
                <pre className="whitespace-pre-wrap bg-muted/30 p-4 text-sm leading-6">
                  {detail.text}
                </pre>
              </ScrollArea>
            ) : detail.html ? (
              <ScrollArea className="max-h-[360px] rounded-lg border">
                <div
                  className="max-w-none bg-muted/30 p-4 text-sm leading-6 wrap-break-word"
                  dangerouslySetInnerHTML={{ __html: detail.html }}
                />
              </ScrollArea>
            ) : (
              <EmptyState message="No content available." />
            )}
          </article>
        )}
      </CardContent>
      <Separator className="mx-6" />
      <CardFooter className="justify-end pb-6">
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={!selectedId || deletingId === selectedId}
        >
          {deletingId === selectedId ? "Deleting…" : "Delete message"}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ComposerPanelProps {
  draft: ComposeDraft;
  sending: boolean;
  onDraftChange: (field: keyof ComposeDraft, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  email: string;
}

function ComposerPanel({
  draft,
  sending,
  onDraftChange,
  onSubmit,
  email,
}: ComposerPanelProps) {
  return (
    <Card className="border-border/80">
      <CardHeader className="px-6">
        <CardTitle className="text-lg">Compose</CardTitle>
        <CardDescription>
          Send a new message without leaving your inbox.
        </CardDescription>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="px-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="compose-to">To</Label>
            <Input
              id="compose-to"
              type="email"
              value={draft.to}
              onChange={(event) => onDraftChange("to", event.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              value={draft.subject}
              onChange={(event) => onDraftChange("subject", event.target.value)}
              placeholder="What is this about?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              rows={8}
              value={draft.body}
              onChange={(event) => onDraftChange("body", event.target.value)}
              placeholder="Write your message here…"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Emails are sent from {email}
            </p>
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface MailListItemProps {
  message: MailSummary;
  selected: boolean;
  onSelect: () => void;
}

function MailListItem({ message, selected, onSelect }: MailListItemProps) {
  const initials = createAvatarFallback(message.from);

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      className={cn(
        "w-full justify-start rounded-lg border px-3 py-3 text-left transition",
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-transparent hover:border-border hover:bg-muted/60"
      )}
    >
      <div className="flex w-full items-start gap-3">
        <Avatar className="mt-1 size-9 border">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex w-full flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium leading-tight">
              {message.subject || "(No subject)"}
            </p>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {formatDisplayDate(message.date)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate" title={message.from || "Unknown sender"}>
              {message.from || "Unknown sender"}
            </span>
            {!message.seen && (
              <Badge className="shrink-0" variant="secondary">
                New
              </Badge>
            )}
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {message.snippet || "No preview available."}
          </p>
        </div>
      </div>
    </Button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
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
  return date.toLocaleString();
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
