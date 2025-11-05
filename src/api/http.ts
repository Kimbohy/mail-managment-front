const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface ApiError {
  status: number;
  message: string;
}

export interface RequestConfig extends RequestInit {
  sessionId?: string;
}

function buildHeaders(config?: RequestConfig) {
  const headers = new Headers(config?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (config?.sessionId) {
    headers.set("x-session-id", config.sessionId);
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  config?: RequestConfig
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...config,
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw { status: response.status, message } as ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") {
      return data.message;
    }
  } catch (_) {
    // ignore JSON parse errors
  }
  return response.statusText || "Request failed";
}
