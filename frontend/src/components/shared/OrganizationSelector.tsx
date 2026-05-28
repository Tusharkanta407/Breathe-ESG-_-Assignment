import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchTenants } from "@/api/tenants";
import { isValidTenantId } from "@/lib/tenant-id";
import { useTenantStore } from "@/stores/tenantStore";

/** Pick client organization by name — no manual UUID typing. */
export function OrganizationSelector() {
  const { tenantId, setTenantId } = useTenantStore();

  const { data: tenants = [], isLoading, isError } = useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!tenants.length) return;
    const match = tenants.find((t) => t.id === tenantId);
    if (!isValidTenantId(tenantId) || !match) {
      const preferred = tenants.find((t) => t.slug === "demo-corp") ?? tenants[0];
      if (preferred) setTenantId(preferred.id);
    }
  }, [tenants, tenantId, setTenantId]);

  if (isLoading) {
    return (
      <span className="hidden text-xs text-muted-foreground lg:inline">Loading…</span>
    );
  }

  if (isError || tenants.length === 0) {
    return (
      <span
        className="hidden max-w-[12rem] truncate text-xs text-[var(--color-destructive)] lg:inline"
        title="Start backend and run: python manage.py seed_demo"
      >
        No organization — start backend
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
