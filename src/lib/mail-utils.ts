import { isApiError, resolveErrorMessage } from "@/lib/api-errors";

/**
 * Creates an avatar fallback string from an email address or name
 */
export function createAvatarFallback(from: string | null | undefined): string {
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

/**
 * Formats a date string for display
 */
export function formatDisplayDate(iso: string): string {
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

/**
 * Handles API failures and session expiration
 */
export function handleApiFailure(
  error: unknown,
  onSessionExpired: () => void,
  setMessage: (message: string) => void
): void {
  if (isApiError(error) && error.status === 401) {
    onSessionExpired();
    return;
  }
  setMessage(resolveErrorMessage(error));
}

/**
 * Formats email addresses or names for display
 * If the input start with a quote, it is the returned name is inly the part inside the quotes
 * Otherwise, the input is returned as is
 */
export function formatDisplayName(nameOrEmail: string): string {
  const quoteMatch = nameOrEmail.match(/^"(.*?)"/);
  if (quoteMatch) {
    return quoteMatch[1];
  }
  return nameOrEmail;
}

/**
 * Format the subject line for display
 * - If the subject is null or undefined, returns "(No subject)"
 * - If the subject start with "Re: " or "Fwd: ", it is trimmed
 * - Otherwise, the subject is returned as is
 */
export function formatSubject(subject: string | null | undefined): string {
  if (!subject || subject.trim() === "") {
    return "(No subject)";
  }
  return subject.replace(/^(Re: |Fwd: )/i, "").trim();
}
