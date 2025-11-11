import { useCallback, useEffect, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import {
  listMessages,
  getMessage,
  type MailSummary,
  type MailDetail,
} from "@/api/mail";
import { resolveErrorMessage } from "@/lib/api-errors";
import type { BoxType } from "@/lib/nuqs-parser";

interface UseMessagesOptions {
  sessionId: string;
  currentMailbox: BoxType;
  onSessionExpired: () => void;
}

export function useMessages({
  sessionId,
  currentMailbox,
  onSessionExpired,
}: UseMessagesOptions) {
  const [messages, setMessages] = useState<MailSummary[]>([]);
  const [selectedId, setSelectedId] = useQueryState(
    "selectedId",
    parseAsString
  );
  const [detail, setDetail] = useState<MailDetail | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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
  }, [onSessionExpired, sessionId, currentMailbox, setSelectedId]);

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

  return {
    messages,
    setMessages,
    selectedId,
    setSelectedId,
    detail,
    setDetail,
    listLoading,
    detailLoading,
    refreshMessages,
  };
}
