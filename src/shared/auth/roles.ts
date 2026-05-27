import { getAccessToken } from "./tokenStorage";

export type UserRole = "parent" | "child" | "admin" | "unknown";

const RESOLVED_ROLE_KEY = "deinweg_resolved_role";

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const json = atob(payload);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeRole(raw: unknown): UserRole {
  if (typeof raw !== "string") {
    return "unknown";
  }

  const value = raw.toLowerCase();
  if (value === "parent") return "parent";
  if (value === "child" || value === "student") return "child";
  if (value === "admin" || value === "staff") return "admin";
  return "unknown";
}

function normalizeRoleFromCollection(raw: unknown): UserRole {
  if (!Array.isArray(raw)) {
    return "unknown";
  }

  for (const entry of raw) {
    const role = normalizeRole(entry);
    if (role !== "unknown") {
      return role;
    }
  }

  return "unknown";
}

function readResolvedRole(): UserRole {
  const raw = localStorage.getItem(RESOLVED_ROLE_KEY);
  if (raw === "admin" || raw === "parent" || raw === "child") {
    return raw;
  }
  return "unknown";
}

export function setResolvedRole(role: UserRole): void {
  if (role === "admin" || role === "parent" || role === "child") {
    localStorage.setItem(RESOLVED_ROLE_KEY, role);
    return;
  }
  localStorage.removeItem(RESOLVED_ROLE_KEY);
}

export function clearResolvedRole(): void {
  localStorage.removeItem(RESOLVED_ROLE_KEY);
}

export function getUserRoleFromToken(): UserRole {
  const token = getAccessToken();
  if (!token) {
    return "unknown";
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    return "unknown";
  }

  // TODO: confirm with backend
  // Final role claim key should be documented and stable.
  const fromRole = normalizeRole(payload.role);
  if (fromRole !== "unknown") return fromRole;

  const fromUserRole = normalizeRole(payload.user_role);
  if (fromUserRole !== "unknown") return fromUserRole;

  const fromRoles = normalizeRoleFromCollection(payload.roles);
  if (fromRoles !== "unknown") return fromRoles;

  const fromGroups = normalizeRoleFromCollection(payload.groups);
  if (fromGroups !== "unknown") return fromGroups;

  const nestedUser =
    payload.user && typeof payload.user === "object"
      ? (payload.user as Record<string, unknown>)
      : null;

  if (nestedUser) {
    const nestedRole = normalizeRole(nestedUser.role);
    if (nestedRole !== "unknown") return nestedRole;

    const nestedUserRole = normalizeRole(nestedUser.user_role);
    if (nestedUserRole !== "unknown") return nestedUserRole;

    const nestedRoles = normalizeRoleFromCollection(nestedUser.roles);
    if (nestedRoles !== "unknown") return nestedRoles;

    const nestedGroups = normalizeRoleFromCollection(nestedUser.groups);
    if (nestedGroups !== "unknown") return nestedGroups;

    if (isTruthyFlag(nestedUser.is_staff) || isTruthyFlag(nestedUser.is_superuser)) {
      return "admin";
    }
  }

  if (isTruthyFlag(payload.is_staff)) {
    return "admin";
  }

  if (isTruthyFlag(payload.is_superuser) || isTruthyFlag(payload.is_admin)) {
    return "admin";
  }

  return readResolvedRole();
}

export function getDefaultRouteByRole(role: UserRole): string {
  if (role === "admin" || role === "parent" || role === "child") {
    return "/home";
  }
  return "/login";
}

export function canRoleAccessPath(role: UserRole, path: string): boolean {
  if (path === "/") {
    return true;
  }
  if (path.startsWith("/home")) {
    return role !== "unknown";
  }
  if (path.startsWith("/schedule")) {
    return role === "parent" || role === "child";
  }
  if (path.startsWith("/cabinet/parent")) {
    return role === "parent";
  }
  if (path.startsWith("/cabinet/child")) {
    return role === "child";
  }
  if (path.startsWith("/admin")) {
    return role === "admin";
  }
  return false;
}
