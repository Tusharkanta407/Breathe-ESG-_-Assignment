import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  X,
  Check,
  Ban,
  Lock,
  Loader2,
  RefreshCw,
  Building2,
  ArrowRight,
} from "lucide-react";
import { fetchAuditEvents } from "@/api/audit";
import { registerPlant } from "@/api/lookups";
import { revalidateActivity } from "@/api/review";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { formatScope, formatSourceType } from "@/lib/api-utils";
import { ISSUE_GUIDANCE, REVIEW_STEPS } from "@/lib/review-guidance";
import type { NormalizedActivity } from "@/types";

type Props = {
  row: NormalizedActivity;
  onClose: () => void;
  onAct: (
    id: string,
    decision: "approve" | "reject",
    comment?: string,
  ) => Promise<boolean>;
};

export function ActivityReviewDrawer({ row, onClose, onAct }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [plantName, setPlantName] = useState("");
  const [localRow, setLocalRow] = useState(row);

  useEffect(() => {
    setLocalRow(row);
    setPlantName("");
    setComment("");
  }, [row]);

  const blocking = localRow.validation_issues.some((i) => i.is_blocking);
  const canApprove =
    !blocking &&
    !localRow.is_locked &&
    localRow.review_status !== "approved";

  const { data: auditEvents = [] } = useQuery({
    queryKey: ["audit", localRow.id],
    queryFn: () => fetchAuditEvents(localRow.id),
  });

  const unknownPlant = localRow.validation_issues.find(
    (i) => i.issue_code === "unknown_plant",
  );

  const stepIndex = localRow.is_locked
    ? 4
    : localRow.review_status === "approved"
      ? 3
      : localRow.review_status === "rejected"
        ? 2
        : blocking
          ? 2
          : 2;

  async function handle(decision: "approve" | "reject") {
    setLoading(true);
    try {
      const ok = await onAct(localRow.id, decision, comment);
      if (!ok) return;
    } finally {
      setLoading(false);
    }
  }

  async function resolvePlant() {
    const code = localRow.facility_or_plant_code;
    if (!code) return;
    setLoading(true);
    try {
      await registerPlant({
        plant_code: code,
        plant_name: plantName.trim() || code,
      });
      const updated = await revalidateActivity(localRow.id);
      setLocalRow(updated);
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not register facility");
    } finally {
      setLoading(false);
    }
  }

  async function recheckValidation() {
    setLoading(true);
    try {
      const updated = await revalidateActivity(localRow.id);
      setLocalRow(updated);
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Revalidation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex" onMouseDown={onClose}>
      <div className="flex-1 bg-foreground/20" />
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl"
      >
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Activity review
              </p>
              <h2 className="text-lg font-semibold capitalize">
                {localRow.activity_category.replace(/_/g, " ")}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatSourceType(localRow.source_type)} · {formatScope(localRow.scope_category)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
          <WorkflowSteps currentIndex={stepIndex} status={localRow.review_status} locked={localRow.is_locked} />
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <h3 className="text-xs font-medium uppercase text-muted-foreground">Activity details</h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
              <Detail label="Facility / plant" value={localRow.facility_or_plant_code || "—"} />
              <Detail
                label="Date"
                value={
                  localRow.activity_date
                    ? new Date(localRow.activity_date).toLocaleDateString()
                    : "—"
                }
              />
              <Detail
                label="Quantity"
                value={
                  localRow.quantity_value_canonical
                    ? `${localRow.quantity_value_canonical} ${localRow.quantity_unit_canonical}`
                    : localRow.quantity_value
                      ? `${localRow.quantity_value} ${localRow.quantity_unit_raw}`
                      : "—"
                }
              />
              <Detail label="Cost center" value={localRow.cost_center || "—"} />
            </dl>
            <Link
              to="/traceability"
              className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
            >
              View source lineage <ArrowRight className="size-3" />
            </Link>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase text-muted-foreground">Validation</h3>
              {!localRow.is_locked && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={recheckValidation}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="size-3" /> Re-check
                </button>
              )}
            </div>
            {localRow.validation_issues.length === 0 ? (
              <p className="rounded-md border border-[color-mix(in_oklab,var(--color-success)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_8%,transparent)] px-3 py-2 text-sm text-[var(--color-success)]">
                No open issues — ready to approve.
              </p>
            ) : (
              <ul className="space-y-3">
                {localRow.validation_issues.map((i) => {
                  const guide = ISSUE_GUIDANCE[i.issue_code];
                  return (
                    <li
                      key={i.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={statusTone(i.severity)}>
                          {guide?.label ?? i.issue_code}
                        </StatusBadge>
                        {i.is_blocking && (
                          <span className="text-[10px] font-medium uppercase text-[var(--color-destructive)]">
                            Blocks approval
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-muted-foreground">{i.message}</p>
                      {guide?.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{guide.explanation}</p>
                      )}
                      {guide?.resolveHint && (
                        <p className="mt-1 text-xs font-medium text-foreground">{guide.resolveHint}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {unknownPlant && !localRow.is_locked && (
            <section className="rounded-lg border border-[color-mix(in_oklab,var(--color-accent)_25%,transparent)] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="size-4 text-[var(--color-accent)]" />
                Register facility: {localRow.facility_or_plant_code}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Add this plant code to your lookup table so the row can be approved.
              </p>
              <input
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                placeholder="Facility name (e.g. Berlin Plant)"
                className="mt-3 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <button
                type="button"
                disabled={loading}
                onClick={resolvePlant}
                className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Register &amp; re-check validation
              </button>
            </section>
          )}

          {localRow.emission_computations?.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Emissions (after approval)
              </h3>
              {localRow.emission_computations.map((e) => (
                <p key={e.id} className="mono text-sm">
                  {Number(e.co2e_kg).toFixed(2)} kg CO₂e · {e.factor_key}
                </p>
              ))}
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Audit trail</h3>
            {auditEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Events appear here after approval, rejection, or ingestion.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {auditEvents.map((e) => (
                  <li key={e.id} className="flex gap-2 text-xs">
                    <span className="shrink-0 text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                    <span className="capitalize">{e.event_type.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!localRow.is_locked && (
            <section>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                Reviewer note (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Reason for approval or rejection…"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </section>
          )}
        </div>

        <footer className="border-t border-border px-5 py-4">
          {blocking && !unknownPlant && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-destructive)]">
              <Lock className="size-3.5" />
              Resolve all blocking issues before approval.
            </p>
          )}
          {canApprove && (
            <p className="mb-3 text-xs text-muted-foreground">
              Approving locks this row and records baseline emissions for auditors.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || localRow.is_locked}
              onClick={() => handle("reject")}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md border px-3 text-sm disabled:opacity-50"
            >
              <Ban className="size-3.5" /> Reject
            </button>
            <button
              type="button"
              disabled={loading || !canApprove}
              onClick={() => handle("approve")}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md bg-[var(--color-success)] px-3 text-sm font-medium text-white disabled:opacity-40"
            >
              <Check className="size-3.5" /> Approve &amp; lock
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function WorkflowSteps({
  currentIndex,
  status,
  locked,
}: {
  currentIndex: number;
  status: string;
  locked: boolean;
}) {
  return (
    <ol className="mt-4 flex gap-1">
      {REVIEW_STEPS.map((step, i) => {
        const done = i < currentIndex || (locked && i <= 4);
        const current = i === currentIndex;
        return (
          <li
            key={step.key}
            title={`${step.label}: ${step.description}`}
            className={`h-1 flex-1 rounded-full ${
              done
                ? "bg-[var(--color-success)]"
                : current
                  ? "bg-[var(--color-accent)]"
                  : "bg-muted"
            }`}
          />
        );
      })}
    </ol>
  );
}
