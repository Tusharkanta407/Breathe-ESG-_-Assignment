/**
 * API root for fetch (includes `/api`, no trailing slash).
 *
 * Local dev: same-origin `/api` (Vite proxy → Django or Railway).
 * Vercel: `/api` when vercel.json rewrite works; else build-time VITE_API_BASE (CORS * on Railway).
 */
export function getApiBase(): string {
  const baked = (import.meta.env.VITE_API_BASE as string | undefined)
    ?.trim()
    ?.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    // Deployed app: use Railway URL from Vercel env (rewrite often missing on SPA-only deploys).
    if (!isLocal && baked) return baked;
    return "/api";
  }

  return baked || "http://127.0.0.1:8000/api";
}
