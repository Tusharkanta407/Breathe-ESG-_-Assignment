/**
 * API root for fetch (includes `/api`, no trailing slash).
 *
 * Browser: always same-origin `/api` (no CORS; Vite or Vercel proxy → backend).
 * SSR only: `VITE_API_BASE` or local Django.
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  const ssrBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  return ssrBase?.replace(/\/$/, "") || "http://127.0.0.1:8000/api";
}
