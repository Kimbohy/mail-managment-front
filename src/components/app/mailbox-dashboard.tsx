import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SessionInfo } from "@/api/auth";
import { MessageViewer } from "./message-viewer";
import { ComposeDialog } from "./compose-dialog";
import DeleteMessageDialog from "./delete-message-dialog";
import Header from "./top-nav-bar/header";
import { MailboxSidebar } from "./mailbox-sidebar";
import { useMessages } from "@/hooks/useMessages";
import { useMessageFilters } from "@/hooks/useMessageFilters";
import { useMessageDelete } from "@/hooks/useMessageDelete";
import { useCompose } from "@/hooks/useCompose";
import { useMailbox } from "@/hooks/useMailbox";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentMailbox, handleMailboxChange } = useMailbox();

  const {
    messages,
    setMessages,
    selectedId,
    setSelectedId,
    detail,
    setDetail,
    listLoading,
    detailLoading,
    refreshMessages,
  } = useMessages({
    sessionId: session.sessionId,
    currentMailbox,
    onSessionExpired,
  });

  const { filteredMessages, unreadCount } = useMessageFilters(messages);

  const {
    deletingId,
    restoringId,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleDeleteClick,
    handleDeleteConfirm,
    handleRestore,
  } = useMessageDelete({
    sessionId: session.sessionId,
    currentMailbox,
    setMessages,
    setSelectedId,
    setDetail,
    onSessionExpired,
  });

  const {
    composeOpen,
    setComposeOpen,
    sending,
    composeDraft,
    handleDraftChange,
    handleSend,
  } = useCompose({
    sessionId: session.sessionId,
    onSessionExpired,
    onSuccess: refreshMessages,
  });

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Top Navigation Bar */}
        <Header
          onLogout={onLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          session={session}
          setComposeOpen={setComposeOpen}
          refreshMessages={refreshMessages}
          listLoading={listLoading}
          onTrashClick={() =>
            handleMailboxChange("TRASH", () => {
              setSelectedId(null);
              setDetail(null);
            })
          }
        />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden relative">
          <MailboxSidebar
            currentMailbox={currentMailbox}
            onMailboxChange={(mailbox) =>
              handleMailboxChange(mailbox, () => {
                setSelectedId(null);
                setDetail(null);
              })
            }
            messages={filteredMessages}
            selectedId={selectedId}
            onSelectMessage={setSelectedId}
            loading={listLoading}
            unreadCount={unreadCount}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <main className="flex flex-1 flex-col">
            <MessageViewer
              detail={detail}
              loading={detailLoading}
              selectedId={selectedId}
              deletingId={deletingId}
              onDelete={handleDeleteClick}
              isTrash={currentMailbox === "TRASH"}
              onRestore={currentMailbox === "TRASH" ? handleRestore : undefined}
              restoringId={restoringId}
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

        <DeleteMessageDialog
          deleteConfirmOpen={deleteConfirmOpen}
          setDeleteConfirmOpen={setDeleteConfirmOpen}
          handleDeleteConfirm={handleDeleteConfirm}
          isTrash={currentMailbox === "TRASH"}
        />
      </div>
    </TooltipProvider>
  );
}
