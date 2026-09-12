"use client";

/**
 * Browser API client.
 *
 * The access token lives in memory only (never localStorage) so XSS cannot
 * steal a persistent credential. On a 401 the client silently calls
 * /api/auth/refresh - the HTTP-only cookie travels automatically - and retries
 * the original request once.
 */
let accessToken = null;
let refreshing = null;

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new ApiClientError(json.error || "Session expired", res.status);
        accessToken = json.data.accessToken;
        return json.data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api(path, { method = "GET", body, retry = true } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    try {
      await refreshAccessToken();
      return api(path, { method, body, retry: false });
    } catch (err) {
      throw err;
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new ApiClientError(json.error || "Request failed", res.status, json.details);
  }
  return json.data;
}

export const bootstrapSession = refreshAccessToken;
