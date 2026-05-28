/**
 * API root for fetch (includes `/api`, no trailing slash).
 *
 * Local: `/api` → Vite proxy.
 * Vercel: `/api` when rewrite works; `VITE_API_BASE` when set at build time (direct Railway, CORS *).
 */
export function getApiBase(): string {
  const baked = (import.meta.env.VITE_API_BASE as string | undefined)
    ?.trim()
    ?.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isLocal && baked) return baked;
    return "/api";
  }

  return baked || "http://127.0.0.1:8000/api";
}

/** Alternate base when same-origin `/api` returns the SPA (HTML) instead of JSON. */
export function getApiBaseFallback(): string | null {
  const baked = (import.meta.env.VITE_API_BASE as string | undefined)
    ?.trim()
    ?.replace(/\/$/, "");
  if (!baked || baked === getApiBase()) return null;
  return baked;
}
