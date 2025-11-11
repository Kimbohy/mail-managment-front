import { useQueryState } from "nuqs";
import { mailBoxTypeParser, type BoxType } from "@/lib/nuqs-parser";

export function useMailbox() {
  const [currentMailbox, setCurrentMailbox] = useQueryState(
    "mailbox",
    mailBoxTypeParser.withDefault("INBOX" as BoxType)
  );

  const handleMailboxChange = (mailbox: BoxType, onNavigate?: () => void) => {
    setCurrentMailbox(mailbox);
    onNavigate?.();
  };

  return {
    currentMailbox,
    setCurrentMailbox,
    handleMailboxChange,
  };
}
