import { useMemo } from "react";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import type { MailSummary } from "@/api/mail";

export function useMessageFilters(messages: MailSummary[]) {
  const [searchQuery] = useQueryState("search", parseAsString.withDefault(""));
  const [showUnreadOnly] = useQueryState(
    "unread",
    parseAsBoolean.withDefault(false)
  );

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

  return {
    searchQuery,
    showUnreadOnly,
    unreadCount,
    filteredMessages,
  };
}
