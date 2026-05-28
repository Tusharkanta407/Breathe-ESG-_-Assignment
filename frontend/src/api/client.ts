import { getApiBase, getApiBaseFallback } from "@/lib/api-base";
import { isValidTenantId } from "@/lib/tenant-id";
import { useTenantStore } from "../stores/tenantStore";

async function request<T>(
  apiBase: string,
  path: string,
  options: RequestInit,
): Promise<Response> {
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
  return fetch(`${apiBase}${path}`, { ...options, headers });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let apiBase = getApiBase();
  let res: Response;

  try {
    res = await request(apiBase, path, options);
  } catch {
    throw new Error(
      "Network error — check Railway is up or run Django locally on port 8000",
    );
  }

  let contentType = res.headers.get("content-type") ?? "";
  const fallback = getApiBaseFallback();
  if (contentType.includes("text/html") && fallback) {
    apiBase = fallback;
    res = await request(apiBase, path, options);
    contentType = res.headers.get("content-type") ?? "";
  }

  if (contentType.includes("text/html")) {
    throw new Error(
      "API returned HTML — set VITE_API_BASE on Vercel to your Railway URL + /api, then redeploy",
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
        detail = err.detail
          .map((d) => (typeof d === "string" ? d : d.msg ?? ""))
          .filter(Boolean)
          .join(", ");
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
