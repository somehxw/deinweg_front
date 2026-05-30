import { env } from "../config/env";
import {
  clearAccessToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken
} from "../auth/tokenStorage";

export interface ApiErrorPayload {
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorPayload | null;

  constructor(message: string, status: number, data: ApiErrorPayload | null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

let refreshInFlight: Promise<string | null> | null = null;

function shouldSkipAuthRetry(path: string): boolean {
  return path.includes("/api/v1/auth/jwt/create/") || path.includes("/api/v1/auth/jwt/refresh/");
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      return null;
    }

    const response = await fetch(`${env.apiBaseUrl}/api/v1/auth/jwt/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh })
    });

    if (!response.ok) {
      return null;
    }

    const hasJson = response.headers.get("Content-Type")?.includes("application/json");
    if (!hasJson) {
      return null;
    }

    const data = (await response.json()) as { access?: string };
    if (!data.access) {
      return null;
    }

    setAccessToken(data.access);
    return data.access;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function forceLogin(): void {
  clearAccessToken();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

async function rawRequest(
  path: string,
  options: RequestOptions,
  accessTokenOverride?: string | null
): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = accessTokenOverride ?? getAccessToken();
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body !== undefined && !isFormDataBody) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : isFormDataBody
          ? (options.body as FormData)
          : JSON.stringify(options.body)
  });
}

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  let response = await rawRequest(path, options);

  if (response.status === 401 && !shouldSkipAuthRetry(path)) {
    const nextAccess = await tryRefreshAccessToken();
    if (nextAccess) {
      response = await rawRequest(path, options, nextAccess);
    } else {
      forceLogin();
    }
  }

  const hasJson = response.headers.get("Content-Type")?.includes("application/json");
  const data = hasJson ? ((await response.json()) as ApiErrorPayload) : null;

  if (!response.ok) {
    if (response.status === 401) {
      forceLogin();
    }
    throw new ApiError("Request failed", response.status, data);
  }

  return data as T;
}
