import { useEffect, useState } from "react";
import { LoginCard } from "@/components/app/login-card";
import { MailboxDashboard } from "./components/app/mailbox-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveErrorMessage } from "@/lib/api-errors";
import {
  login,
  logout,
  verify,
  type LoginPayload,
  type SessionInfo,
} from "./api/auth";

const SESSION_STORAGE_KEY = "mail-manager/session";

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const stored = loadStoredSession();
    if (!stored) {
      setBootstrapping(false);
      return;
    }

    verify(stored.sessionId)
      .then(({ email }) => {
        const nextSession: SessionInfo = { ...stored, email };
        setSession(nextSession);
        persistSession(nextSession);
      })
      .catch(() => {
        persistSession(null);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  const handleLogin = async (credentials: LoginPayload) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const info = await login(credentials);
      setSession(info);
      persistSession(info);
    } catch (error) {
      setAuthError(resolveErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!session) {
      return;
    }
    try {
      await logout(session.sessionId);
    } catch (error) {
      setAuthError(resolveErrorMessage(error));
    } finally {
      setSession(null);
      persistSession(null);
    }
  };

  const handleSessionExpired = () => {
    setSession(null);
    persistSession(null);
    setAuthError("Session expired. Please sign in again.");
  };

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Skeleton className="h-6 w-32" />
          <span className="text-sm font-medium">Checking your session…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
        <LoginCard
          loading={authLoading}
          error={authError}
          onSubmit={handleLogin}
        />
      </div>
    );
  }

  return (
    <MailboxDashboard
      session={session}
      onLogout={handleLogout}
      onSessionExpired={handleSessionExpired}
    />
  );
}

export default App;

function loadStoredSession(): SessionInfo | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SessionInfo;
    if (parsed?.sessionId) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse stored session", error);
  }
  return null;
}

function persistSession(info: SessionInfo | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!info) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(info));
}
