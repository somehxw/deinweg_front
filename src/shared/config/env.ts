export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "")
};

if (!env.apiBaseUrl) {
  // TODO: confirm with backend
  // VITE_API_BASE_URL is required for API calls in non-mock environments.
}
