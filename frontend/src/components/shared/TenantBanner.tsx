import { useTenantStore } from "@/stores/tenantStore";

export function TenantBanner() {
  const tenantId = useTenantStore((s) => s.tenantId);
  if (tenantId) return null;
  return (
    <div className="mb-4 rounded-md border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-4 py-2 text-sm">
      Choose <strong>Client</strong> in the header (e.g. Demo Corp). Make sure the
      backend is running (<code className="text-xs">python manage.py runserver</code>
      ).
    </div>
  );
}
