import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Upload,
  ListChecks,
  AlertCircle,
} from "lucide-react";
import { fetchBatches } from "@/api/ingestion";
import { fetchActivities, fetchSummary } from "@/api/review";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { TenantBanner } from "@/components/shared/TenantBanner";
import { mergeSummaryWithBatches } from "@/lib/dashboard-stats";
import { formatSourceType } from "@/lib/api-utils";
import { useTenantStore } from "@/stores/tenantStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Overview · BreathESG" }],
  }),
  component: Overview,
});

function Overview() {
  const tenantId = useTenantStore((s) => s.tenantId);

  const { data: summaryRaw, isLoading: summaryLoading } = useQuery({
    queryKey: ["summary", tenantId],
    queryFn: fetchSummary,
    enabled: !!tenantId,
  });

  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ["batches", tenantId],
    queryFn: fetchBatches,
    enabled: !!tenantId,
  });

  const { data: flagged = [] } = useQuery({
    queryKey: ["activities", tenantId, "blocking"],
    queryFn: () => fetchActivities({ blocking: "true", status: "pending" }),
    enabled: !!tenantId,
  });

  const summary = useMemo(
    () => mergeSummaryWithBatches(summaryRaw, batches),
    [summaryRaw, batches],
  );

  const recent = batches.slice(0, 5);
  const loading = summaryLoading || batchesLoading;

  return (
    <div className="space-y-6">
      <TenantBanner />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <BrandLogo size="lg" className="hidden shrink-0 pt-0.5 sm:flex" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              What was uploaded and what still needs analyst sign-off
            </p>
          </div>
        </div>
        <Link
          to="/upload"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Upload data <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      )}

      {!loading && summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="File uploads"
            value={summary.ingestion.total_batches}
            sub={
              summary.ingestion.failed_batches > 0
                ? `${summary.ingestion.failed_batches} failed`
                : `${summary.ingestion.completed_batches} completed`
            }
            icon={Upload}
          />
          <StatCard
            label="Records imported"
            value={summary.ingestion.total_raw_rows}
            sub="Lines saved from SAP, utility & travel files"
            icon={ListChecks}
          />
          <StatCard
            label="Awaiting review"
            value={summary.pending}
            sub={
              summary.ready_to_approve > 0
                ? `${summary.ready_to_approve} ready to approve now`
                : "Open review queue to sign off"
            }
            icon={Clock}
            highlight="warning"
          />
          <StatCard
            label="Approved for audit"
            value={summary.approved}
            sub="Locked and included in reporting"
            icon={CheckCircle2}
            highlight="success"
          />
        </div>
      )}

      {!loading && summary && summary.pending_blocking > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-[color-mix(in_oklab,var(--color-warning)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[oklch(0.45_0.12_75)]" />
          <p>
            <strong>{summary.pending_blocking}</strong> pending{" "}
            {summary.pending_blocking === 1 ? "row needs" : "rows need"} a fix
            (e.g. unknown plant code) before you can approve.{" "}
            <Link to="/review" className="font-medium text-[var(--color-accent)] hover:underline">
              Go to review queue →
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-medium">Recent uploads</div>
            <Link
              to="/ingestion"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              All uploads →
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Source</th>
                <th>Status</th>
                <th className="text-right">Rows</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No uploads yet. Use Upload data to import a file.
                  </td>
                </tr>
              )}
              {recent.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium">{b.input_ref || "—"}</td>
                  <td>{formatSourceType(b.source_type)}</td>
                  <td>
                    <StatusBadge tone={statusTone(b.status)}>{b.status}</StatusBadge>
                  </td>
                  <td className="mono text-right">{b.row_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-medium">Blocked — needs fix</div>
            <Link
              to="/review"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Review queue →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {flagged.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing blocking approval right now.
              </li>
            )}
            {flagged.slice(0, 6).map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="text-sm font-medium capitalize">
                  {a.activity_category.replace(/_/g, " ")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {a.validation_issues[0]?.message ?? "Validation issue"}
                  {a.facility_or_plant_code ? ` · ${a.facility_or_plant_code}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  highlight?: "success" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${
          highlight === "success"
            ? "text-[var(--color-success)]"
            : highlight === "warning"
              ? "text-[oklch(0.45_0.12_75)]"
              : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}
