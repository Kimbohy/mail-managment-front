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

export async function listMessages(sessionId: string): Promise<MailSummary[]> {
  return apiFetch("/mail/messages", {
    sessionId,
  });
}

export async function getMessage(
  sessionId: string,
  id: string
): Promise<MailDetail> {
  return apiFetch(`/mail/messages/${id}`, {
    sessionId,
  });
}

export async function deleteMessage(sessionId: string, id: string) {
  await apiFetch(`/mail/messages/${id}`, {
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
