"use client";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_JETKIZ_API_BASE_URL || "https://api.jetkiz.asia"
).replace(/\/$/, "");

const SEARCH_SESSION_KEY = "jetkiz-search-session-id";
const DEVICE_ID_KEY = "jetkiz-device-id";
const APP_VERSION = "web-1";

export type WebsiteSearchTrackResult = {
  query: string;
  searchQueryLogId: string | null;
  resultsCount: number;
};

type SearchClickInput = {
  query: string;
  searchQueryLogId?: string | null;
  entityType: "restaurant" | "product" | "category";
  entityId: string;
  position?: number;
  metadata?: Record<string, unknown>;
};

function randomId(prefix: string) {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getStoredId(storage: Storage, key: string, prefix: string) {
  const current = storage.getItem(key)?.trim();
  if (current) return current;

  const created = randomId(prefix);
  storage.setItem(key, created);
  return created;
}

function getSessionId() {
  if (typeof window === "undefined") return undefined;

  try {
    return getStoredId(
      window.sessionStorage,
      SEARCH_SESSION_KEY,
      "web-search",
    );
  } catch {
    return randomId("web-search");
  }
}

function getDeviceId() {
  if (typeof window === "undefined") return undefined;

  try {
    return getStoredId(window.localStorage, DEVICE_ID_KEY, "web-device");
  } catch {
    return randomId("web-device");
  }
}

function requestHeaders(includeJson = false) {
  return {
    Accept: "application/json",
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    "X-App": "website",
    "X-Platform": "web",
    "X-App-Version": APP_VERSION,
    "X-Locale": "ru",
    "X-Timezone": "Asia/Almaty",
  };
}

export async function trackWebsiteSearch(
  rawQuery: string,
  source: string,
): Promise<WebsiteSearchTrackResult | null> {
  const query = rawQuery.trim();
  if (!query) return null;

  const params = new URLSearchParams({
    q: query,
    page: "1",
    limit: "20",
    source,
    platform: "WEB",
    appVersion: APP_VERSION,
  });

  const sessionId = getSessionId();
  const deviceId = getDeviceId();
  if (sessionId) params.set("sessionId", sessionId);
  if (deviceId) params.set("deviceId", deviceId);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${API_BASE_URL}/search?${params.toString()}`,
      {
        method: "GET",
        headers: requestHeaders(),
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      meta?: {
        searchQueryLogId?: string | null;
        resultsCount?: number;
      };
    };

    return {
      query,
      searchQueryLogId: payload.meta?.searchQueryLogId ?? null,
      resultsCount: Number(payload.meta?.resultsCount ?? 0),
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function trackWebsiteSearchClick({
  query,
  searchQueryLogId,
  entityType,
  entityId,
  position,
  metadata,
}: SearchClickInput): Promise<void> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || !entityId.trim()) return;

  try {
    await fetch(`${API_BASE_URL}/search/click`, {
      method: "POST",
      headers: requestHeaders(true),
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        ...(searchQueryLogId?.trim()
          ? { searchQueryLogId: searchQueryLogId.trim() }
          : {}),
        query: normalizedQuery,
        entityType,
        entityId,
        ...(Number.isInteger(position) ? { position } : {}),
        sessionId: getSessionId(),
        deviceId: getDeviceId(),
        platform: "WEB",
        appVersion: APP_VERSION,
        metadata: {
          source: "website",
          ...(metadata ?? {}),
        },
      }),
    });
  } catch {
    // Analytics must never block the customer journey.
  }
}
