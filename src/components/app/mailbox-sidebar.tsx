import { cn } from "@/lib/utils";
import { MessageList } from "./message-list";
import type { MailSummary } from "@/api/mail";
import type { BoxType } from "@/lib/nuqs-parser";

interface MailboxSidebarProps {
  currentMailbox: BoxType;
  onMailboxChange: (mailbox: BoxType) => void;
  messages: MailSummary[];
  selectedId: string | null;
  onSelectMessage: (id: string) => void;
  loading: boolean;
  unreadCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function MailboxSidebar({
  currentMailbox,
  onMailboxChange,
  messages,
  selectedId,
  onSelectMessage,
  loading,
  unreadCount,
  sidebarOpen,
  setSidebarOpen,
}: MailboxSidebarProps) {
  return (
    <>
      {/* Sidebar - hidden on mobile, overlay on tablet, normal on desktop */}
      <div
        className={cn(
          "absolute md:relative inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <MessageList
          currentMailbox={currentMailbox}
          onMailboxChange={onMailboxChange}
          messages={messages}
          selectedId={selectedId}
          onSelectMessage={(id) => {
            onSelectMessage(id);
            setSidebarOpen(false);
          }}
          loading={loading}
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
    </>
  );
}
