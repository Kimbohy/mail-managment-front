import { apiFetch } from "./http";

export interface MailSummary {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  seen: boolean;
  snippet: string;
}

export interface MailDetail extends MailSummary {
  text?: string;
  html?: string;
}

export interface SendMailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function listMessages(
  sessionId: string,
  mailbox?: string
): Promise<MailSummary[]> {
  const params = mailbox ? `?mailbox=${encodeURIComponent(mailbox)}` : "";
  return apiFetch(`/mail/messages${params}`, {
    sessionId,
  });
}

export async function getMessage(
  sessionId: string,
  id: string,
  mailbox?: string
): Promise<MailDetail> {
  const params = mailbox ? `?mailbox=${encodeURIComponent(mailbox)}` : "";
  return apiFetch(`/mail/messages/${id}${params}`, {
    sessionId,
  });
}

export async function deleteMessage(
  sessionId: string,
  id: string,
  mailbox?: string
) {
  const params = mailbox ? `?mailbox=${encodeURIComponent(mailbox)}` : "";
  await apiFetch(`/mail/messages/${id}${params}`, {
    method: "DELETE",
    sessionId,
  });
}

export async function restoreMessage(
  sessionId: string,
  id: string,
  targetMailbox: string
) {
  await apiFetch(`/mail/messages/${id}/restore`, {
    method: "PUT",
    sessionId,
    body: JSON.stringify({ targetMailbox }),
  });
}

export async function emptyTrash(sessionId: string) {
  await apiFetch("/mail/trash", {
    method: "DELETE",
    sessionId,
  });
}

export async function sendMail(sessionId: string, payload: SendMailPayload) {
  await apiFetch("/mail/send", {
    method: "POST",
    sessionId,
    body: JSON.stringify(payload),
  });
}
