import { apiFetch } from "./http";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SessionInfo {
  sessionId: string;
  expiresAt: number;
  email: string;
}

export async function login(payload: LoginPayload): Promise<SessionInfo> {
  const result = await apiFetch<{ sessionId: string; expiresAt: number }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return {
    sessionId: result.sessionId,
    expiresAt: result.expiresAt,
    email: payload.email,
  };
}

export async function logout(sessionId: string) {
  await apiFetch("/auth/logout", {
    method: "DELETE",
    sessionId,
  });
}

export async function verify(sessionId: string): Promise<{ email: string }> {
  return apiFetch("/auth/verify", {
    sessionId,
  });
}
