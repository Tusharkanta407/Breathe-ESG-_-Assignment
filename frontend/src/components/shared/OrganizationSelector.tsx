import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchTenants } from "@/api/tenants";
import { isValidTenantId } from "@/lib/tenant-id";
import { useTenantStore } from "@/stores/tenantStore";

const isBrowser = typeof window !== "undefined";

/** Pick client organization by name — no manual UUID typing. */
export function OrganizationSelector() {
  const { tenantId, setTenantId } = useTenantStore();
  const { data: tenants = [], isLoading, isError, isFetched, error, refetch } =
    useQuery({
      queryKey: ["tenants"],
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
      <span className="text-xs text-muted-foreground">Loading client…</span>
    );
  }

  const showError = isError || (isFetched && tenants.length === 0);

  if (showError) {
    const detail =
      error instanceof Error
        ? error.message
        : "No tenants — check /api/tenants/ (proxy → Railway or local Django)";
    return (
      <div className="flex max-w-xs flex-col items-end gap-1 text-right">
        <span className="text-xs text-[var(--color-destructive)]" title={detail}>
          API unreachable
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-[10px] text-muted-foreground underline hover:text-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2">
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
