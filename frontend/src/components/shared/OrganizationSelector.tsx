import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchTenants } from "@/api/tenants";
import { isValidTenantId } from "@/lib/tenant-id";
import { useTenantStore } from "@/stores/tenantStore";

const isBrowser = typeof window !== "undefined";

/** Pick client organization by name — no manual UUID typing. */
export function OrganizationSelector() {
  const { tenantId, setTenantId } = useTenantStore();

  const apiBase = import.meta.env.VITE_API_BASE?.trim() || "/api";

  const { data: tenants = [], isLoading, isError, error } = useQuery({
    queryKey: ["tenants", apiBase],
    queryFn: fetchTenants,
    staleTime: 60_000,
    retry: 2,
    enabled: isBrowser,
  });

  useEffect(() => {
    if (!tenants.length) return;
    const match = tenants.find((t) => t.id === tenantId);
    if (!isValidTenantId(tenantId) || !match) {
      const preferred = tenants.find((t) => t.slug === "demo-corp") ?? tenants[0];
      if (preferred) setTenantId(preferred.id);
    }
  }, [tenants, tenantId, setTenantId]);

  if (!isBrowser || isLoading) {
    return (
      <span className="hidden text-xs text-muted-foreground lg:inline">Loading…</span>
    );
  }

  if (isError || tenants.length === 0) {
    const tenantsUrl = `${apiBase.replace(/\/$/, "")}/tenants/`;
    const hint = error instanceof Error ? error.message : `Open ${tenantsUrl} in a new tab`;
    return (
      <span
        className="hidden max-w-[16rem] truncate text-xs text-[var(--color-destructive)] lg:inline"
        title={`${tenantsUrl} — ${hint}`}
      >
        Cannot reach API — see tooltip
      </span>
    );
  }

  return (
    <label className="hidden items-center gap-2 lg:flex">
      <span className="text-xs text-muted-foreground">Client</span>
      <select
        value={
          tenants.some((t) => t.id === tenantId) ? tenantId : tenants[0]?.id ?? ""
        }
        onChange={(e) => setTenantId(e.target.value)}
        className="h-8 max-w-[11rem] rounded-md border border-input bg-background px-2 text-sm font-medium"
        title="Which company's data you are viewing"
      >
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
