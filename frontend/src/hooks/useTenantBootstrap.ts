import { useEffect } from "react";
import { fetchTenants } from "@/api/tenants";
import { useTenantStore } from "@/stores/tenantStore";

/** Load first active tenant when none is selected (after seed_demo). */
export function useTenantBootstrap() {
  const { tenantId, setTenantId } = useTenantStore();

  useEffect(() => {
    if (typeof window === "undefined" || tenantId) return;
    fetchTenants()
      .then((tenants) => {
        const active = tenants.find((t) => t.is_active);
        if (active) setTenantId(active.id);
      })
      .catch(() => {
        /* backend may be offline */
      });
  }, [tenantId, setTenantId]);
}
