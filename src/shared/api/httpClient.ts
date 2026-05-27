import { env } from "../config/env";
import { getAccessToken } from "../auth/tokenStorage";

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

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const hasJson = response.headers.get("Content-Type")?.includes("application/json");
  const data = hasJson ? ((await response.json()) as ApiErrorPayload) : null;

  if (!response.ok) {
    throw new ApiError("Request failed", response.status, data);
  }

  return data as T;
}
