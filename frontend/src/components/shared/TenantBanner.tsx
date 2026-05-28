import { useTenantStore } from "@/stores/tenantStore";

export function TenantBanner() {
  const tenantId = useTenantStore((s) => s.tenantId);
  if (tenantId) return null;
  return (
    <div className="mb-4 rounded-md border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-4 py-2 text-sm">
      Choose <strong>Client</strong> in the header once the API is reachable. Local:{" "}
      <code className="text-xs">python manage.py runserver</code>. Production: set{" "}
      <code className="text-xs">VITE_API_BASE</code> on Vercel to your Railway URL +{" "}
      <code className="text-xs">/api</code>, then redeploy.
    </div>
  );
}
