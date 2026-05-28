import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchActivities } from "@/api/review";
import { fetchAuditEvents } from "@/api/audit";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { TenantBanner } from "@/components/shared/TenantBanner";
import { formatScope, formatSourceType } from "@/lib/api-utils";
import { useTenantStore } from "@/stores/tenantStore";
import { ArrowRight, FileText, Database, GitBranch } from "lucide-react";
import type { NormalizedActivity } from "@/types";

export const Route = createFileRoute("/traceability")({
  head: () => ({ meta: [{ title: "Traceability · BreathESG" }] }),
  component: Traceability,
});

function Traceability() {
  const tenantId = useTenantStore((s) => s.tenantId);

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", tenantId, "all"],
    queryFn: () => fetchActivities(),
    enabled: !!tenantId,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    activities.find((a) => a.id === selectedId) ?? activities[0] ?? null;

  const { data: auditEvents = [] } = useQuery({
    queryKey: ["audit", selected?.id],
    queryFn: () => fetchAuditEvents(selected!.id),
    enabled: !!selected?.id,
  });

  return (
    <div className="space-y-5">
      <TenantBanner />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Source traceability</h1>
        <p className="text-sm text-muted-foreground">
          Follow each activity back to its source file and ingestion batch.
        </p>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No activities yet. Upload data first.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Activities
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {activities.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`flex w-full items-start gap-2 border-l-2 px-3 py-2 text-left text-sm ${
                      selected?.id === a.id
                        ? "border-[var(--color-accent)] bg-muted"
                        : "border-transparent hover:bg-muted/60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{a.activity_category}</div>
                      <div className="mono text-xs text-muted-foreground">{a.id.slice(0, 8)}…</div>
                    </div>
                    <StatusBadge
                      tone={statusTone(a.review_status)}
                      dot={false}
                    >
                      {a.review_status}
                    </StatusBadge>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selected && (
            <TraceDetail activity={selected} auditEvents={auditEvents} />
          )}
        </div>
      )}
    </div>
  );
}

function TraceDetail({
  activity,
  auditEvents,
}: {
  activity: NormalizedActivity;
  auditEvents: { event_type: string; created_at: string; actor_id: string }[];
}) {
  const topIssue = activity.validation_issues[0];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
          <TraceCard
            icon={GitBranch}
            tone="accent"
            title="Normalized activity"
            kvs={[
              ["ID", activity.id],
              [
                "Quantity",
                `${activity.quantity_value_canonical ?? "—"} ${activity.quantity_unit_canonical}`,
              ],
              ["Scope", formatScope(activity.scope_category)],
            ]}
          />
          <Arrow />
          <TraceCard
            icon={Database}
            tone="info"
            title="Raw record"
            kvs={[
              ["ID", activity.raw_record],
              ["Source", formatSourceType(activity.source_type)],
              ["Category", activity.activity_category],
            ]}
          />
          <Arrow />
          <TraceCard
            icon={FileText}
            tone="muted"
            title="Context"
            kvs={[
              ["Facility", activity.facility_or_plant_code || "—"],
              ["Date", activity.activity_date ?? "—"],
              ["Status", activity.review_status],
            ]}
          />
        </div>
        {topIssue && (
          <p className="mt-4 text-sm text-muted-foreground">
            Validation: {topIssue.issue_code} — {topIssue.message}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-3 text-sm font-medium">Audit timeline</div>
        {auditEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events yet.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-4">
            {auditEvents.map((e) => (
              <li key={`${e.created_at}-${e.event_type}`} className="relative">
                <span className="absolute -left-[1.07rem] top-1 size-2 rounded-full bg-[var(--color-accent)] ring-4 ring-surface" />
                <div className="flex items-baseline gap-2">
                  <span className="mono text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                  <span className="text-sm">{e.event_type}</span>
                </div>
                {e.actor_id && (
                  <div className="mono text-xs text-muted-foreground">
                    actor {e.actor_id}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function TraceCard({
  icon: Icon,
  title,
  kvs,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  kvs: [string, string][];
  tone: "accent" | "info" | "muted";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] text-[var(--color-accent)]"
      : tone === "info"
        ? "bg-[color-mix(in_oklab,var(--color-info)_10%,transparent)] text-[var(--color-info)]"
        : "bg-muted text-muted-foreground";
  return (
    <div className="flex-1 rounded-md border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex size-7 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="size-3.5" />
        </div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      </div>
      <dl className="space-y-1.5 text-sm">
        {kvs.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mono text-right text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center md:px-1">
      <ArrowRight className="size-4 text-muted-foreground" />
    </div>
  );
}
