const ACCESS_TOKEN_COOKIE = "deinweg_access_token";
const REFRESH_TOKEN_COOKIE = "deinweg_refresh_token";
const RESOLVED_ROLE_KEY = "deinweg_resolved_role";

export function getAccessToken(): string | null {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const pair of cookies) {
    const [name, ...rest] = pair.split("=");
    if (name === ACCESS_TOKEN_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function setAccessToken(token: string): void {
  const maxAgeSeconds = 60 * 60 * 24 * 7;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
  localStorage.removeItem(RESOLVED_ROLE_KEY);
}

export function getRefreshToken(): string | null {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const pair of cookies) {
    const [name, ...rest] = pair.split("=");
    if (name === REFRESH_TOKEN_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function setRefreshToken(token: string): void {
  const maxAgeSeconds = 60 * 60 * 24 * 14;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function setAuthTokens(access: string, refresh: string): void {
  setAccessToken(access);
  setRefreshToken(refresh);
}

export function clearAccessToken(): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  localStorage.removeItem(RESOLVED_ROLE_KEY);
}

export function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}
