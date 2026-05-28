import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchBatches } from "@/api/ingestion";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { TenantBanner } from "@/components/shared/TenantBanner";
import { formatSourceType } from "@/lib/api-utils";
import { useTenantStore } from "@/stores/tenantStore";
import { Search } from "lucide-react";

export const Route = createFileRoute("/ingestion")({
  head: () => ({ meta: [{ title: "Ingestion History · BreathESG" }] }),
  component: IngestionHistory,
});

function IngestionHistory() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");

  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ["batches", tenantId],
    queryFn: fetchBatches,
    enabled: !!tenantId,
  });

  const sources = [
    "all",
    ...Array.from(new Set(batches.map((b) => b.source_type))),
  ];

  const filtered = useMemo(
    () =>
      batches.filter(
        (b) =>
          (source === "all" || b.source_type === source) &&
          (q === "" ||
            `${b.input_ref} ${b.id}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [batches, source, q],
  );

  return (
    <div className="space-y-5">
      <TenantBanner />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ingestion history</h1>
        <p className="text-sm text-muted-foreground">
          Upload batches from SAP, utility, and travel sources.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search batch or file…"
            className="h-8 w-72 rounded-md border border-input bg-surface pl-8 pr-2 text-sm"
          />
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-8 rounded-md border border-input bg-surface px-2 text-sm"
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All sources" : formatSourceType(s)}
            </option>
          ))}
        </select>
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} batches
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-destructive)]">
          {error instanceof Error ? error.message : "Failed to load batches"}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Source</th>
              <th>Trigger</th>
              <th>Created</th>
              <th className="text-right">Rows</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No ingestion batches found.
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>
                  <div className="font-medium">{b.input_ref || "—"}</div>
                  <div className="mono text-xs text-muted-foreground">{b.id}</div>
                </td>
                <td>{formatSourceType(b.source_type)}</td>
                <td className="text-muted-foreground">{b.trigger_type}</td>
                <td className="text-muted-foreground">
                  {new Date(b.created_at).toLocaleString()}
                </td>
                <td className="mono text-right">{b.row_count}</td>
                <td>
                  <StatusBadge tone={statusTone(b.status)}>{b.status}</StatusBadge>
                </td>
                <td className="max-w-xs truncate text-xs text-[var(--color-destructive)]">
                  {b.status === "failed" ? b.error_summary || "Unknown error" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
