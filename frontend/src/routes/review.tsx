import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchActivities, approveActivity, rejectActivity } from "@/api/review";
import { ActivityReviewDrawer } from "@/components/domain/ActivityReviewDrawer";
import { ReviewWorkflowBanner } from "@/components/domain/ReviewWorkflowBanner";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { ActionFeedback } from "@/components/shared/ActionFeedback";
import { TenantBanner } from "@/components/shared/TenantBanner";
import { formatScope, formatSourceType } from "@/lib/api-utils";
import { useTenantStore } from "@/stores/tenantStore";
import type { NormalizedActivity } from "@/types";
import { Search, Loader2 } from "lucide-react";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review Queue · BreathESG" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("pending");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [selected, setSelected] = useState<NormalizedActivity | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ["activities", tenantId, status, suspiciousOnly],
    queryFn: () =>
      fetchActivities({
        ...(status ? { status } : {}),
        ...(suspiciousOnly ? { suspicious: "true" } : {}),
      }),
    enabled: !!tenantId,
  });

  const filtered = useMemo(
    () =>
      activities.filter((a) => {
        if (!q) return true;
        const hay = `${a.activity_category} ${a.facility_or_plant_code} ${a.validation_issues.map((i) => i.message).join(" ")}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      }),
    [activities, q],
  );

  async function act(
    id: string,
    decision: "approve" | "reject",
    comment?: string,
  ): Promise<boolean> {
    try {
      if (decision === "approve") await approveActivity(id, comment ?? "");
      else await rejectActivity(id, comment ?? "");
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
      setSelected(null);
      setFeedback({
        type: "ok",
        text:
          decision === "approve"
            ? "Approved successfully. This activity is locked and saved to the audit trail."
            : "Rejected successfully. This activity will not be included in reporting.",
      });
      return true;
    } catch (e) {
      setFeedback({
        type: "err",
        text: e instanceof Error ? e.message : "Action failed. Please try again.",
      });
      return false;
    }
  }

  return (
    <div className="space-y-5">
      <TenantBanner />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Review queue</h1>
        <p className="text-sm text-muted-foreground">
          Fix blocking validation issues, then approve rows to lock them for auditors.
        </p>
      </div>

      <ReviewWorkflowBanner />

      {feedback && (
        <ActionFeedback
          type={feedback.type}
          message={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search activity, facility…"
            className="h-8 w-80 rounded-md border border-input bg-surface pl-8 pr-2 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 rounded-md border border-input bg-surface px-2 text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={suspiciousOnly}
            onChange={(e) => setSuspiciousOnly(e.target.checked)}
            className="rounded border-input"
          />
          Warnings only
        </label>
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} rows
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-destructive)]">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Source</th>
              <th>Scope</th>
              <th>Issues</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No activities match filters.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const blocking = a.validation_issues.some((i) => i.is_blocking);
              return (
                <tr
                  key={a.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(a)}
                >
                  <td>
                    <div className="font-medium capitalize">
                      {a.activity_category.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.facility_or_plant_code || "—"}
                      {a.activity_date
                        ? ` · ${new Date(a.activity_date).toLocaleDateString()}`
                        : ""}
                    </div>
                  </td>
                  <td>{formatSourceType(a.source_type)}</td>
                  <td>
                    <StatusBadge tone="muted" dot={false}>
                      {formatScope(a.scope_category)}
                    </StatusBadge>
                  </td>
                  <td className="max-w-xs truncate text-xs">
                    {blocking ? (
                      <span className="text-[var(--color-destructive)]">
                        {a.validation_issues.find((i) => i.is_blocking)?.message}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {a.validation_issues[0]?.message ?? "Ready to approve"}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge tone={statusTone(a.review_status)}>
                      {a.review_status}
                    </StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <ActivityReviewDrawer
          row={selected}
          onClose={() => setSelected(null)}
          onAct={act}
        />
      )}
    </div>
  );
}
