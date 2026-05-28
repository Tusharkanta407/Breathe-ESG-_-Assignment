import { getApiBase } from "@/lib/api-base";
import { isValidTenantId } from "@/lib/tenant-id";
import { useTenantStore } from "../stores/tenantStore";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const apiBase = getApiBase();
  const tenantId = useTenantStore.getState().tenantId;
  const headers = new Headers(options.headers);
  if (isValidTenantId(tenantId)) {
    headers.set("X-Tenant-ID", tenantId.trim());
  }
  const hasBody = options.body != null && options.body !== "";
  if (
    hasBody &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${apiBase}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      "Network error — start Django on :8000 or set VITE_API_BASE in frontend/.env and restart npm run dev",
    );
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(
      "API returned HTML — start Django locally (port 8000) or redeploy Vercel with /api proxy in vercel.json",
    );
  }
  if (!res.ok) {
    const body = await res.text();
    let detail = res.statusText;
    try {
      const err = JSON.parse(body) as { detail?: string | { msg?: string }[] };
      if (typeof err.detail === "string") {
        detail = err.detail;
      } else if (Array.isArray(err.detail)) {
        detail = err.detail.map((d) => (typeof d === "string" ? d : d.msg ?? "")).filter(Boolean).join(", ");
      }
    } catch {
      if (body && !body.trimStart().startsWith("<")) {
        detail = body.length > 280 ? `${body.slice(0, 280)}…` : body;
      }
    }
    throw new Error(detail || "Request failed");
  }
  return res.json() as Promise<T>;
}
