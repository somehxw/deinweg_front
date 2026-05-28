import { httpRequest } from "./httpClient";
import {
  EnrollmentRequestCreateDto,
  EnrollmentRequestCreateResponseDto,
  EnrollmentRequestStatus,
  EnrollmentRequestStatusResponseDto
} from "../types/enrollment";

export function createEnrollmentRequest(
  payload: EnrollmentRequestCreateDto
): Promise<EnrollmentRequestCreateResponseDto> {
  return httpRequest<EnrollmentRequestCreateResponseDto>("/api/v1/enrollment-requests/", {
    method: "POST",
    body: payload
  }).then((response) => ({
    ...response,
    status: normalizeStatus(response.status)
  }));
}

export function getEnrollmentRequestStatus(
  requestId: string,
  token?: string
): Promise<EnrollmentRequestStatusResponseDto> {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return httpRequest<Record<string, unknown>>(
    `/api/v1/enrollment-requests/status/${requestId}/${query}`,
    { method: "GET" }
  ).then((response) => mapStatusResponse(response, requestId));
}

function normalizeStatus(raw: unknown): EnrollmentRequestStatus {
  if (typeof raw !== "string") {
    return "waiting";
  }

  const normalized = raw.toLowerCase();
  if (normalized === "pending") return "waiting";
  if (normalized === "waiting") return "waiting";
  if (normalized === "setw") return "setw";
  if (normalized === "set") return "set";
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "needs_relink") return "needs_relink";

  return "waiting";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function mapStatusResponse(
  response: Record<string, unknown>,
  fallbackId: string
): EnrollmentRequestStatusResponseDto {
  const auth = response.auth;
  const authRecord = auth && typeof auth === "object" ? (auth as Record<string, unknown>) : null;

  return {
    id: asString(response.id) ?? fallbackId,
    status: normalizeStatus(response.status),
    moderation_comment:
      response.moderation_comment === null
        ? null
        : (asString(response.moderation_comment) ?? null),
    updated_at: asString(response.updated_at) ?? "",
    access:
      asString(response.access) ??
      asString(response.access_token) ??
      asString(response.token) ??
      (authRecord ? asString(authRecord.access) : undefined) ??
      (authRecord ? asString(authRecord.access_token) : undefined),
    refresh:
      asString(response.refresh) ??
      asString(response.refresh_token) ??
      (authRecord ? asString(authRecord.refresh) : undefined) ??
      (authRecord ? asString(authRecord.refresh_token) : undefined)
  };
}
