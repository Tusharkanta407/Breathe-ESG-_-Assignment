import { isValidTenantId } from "@/lib/tenant-id";
import { useTenantStore } from "../stores/tenantStore";

function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (!raw) return "/api";
  return raw.replace(/\/$/, "");
}

const API_BASE = resolveApiBase();

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tenantId = useTenantStore.getState().tenantId;
  const headers = new Headers(options.headers);
  if (isValidTenantId(tenantId)) {
    headers.set("X-Tenant-ID", tenantId.trim());
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
