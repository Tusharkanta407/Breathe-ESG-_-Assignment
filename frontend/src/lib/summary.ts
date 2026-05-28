import type { ActivitySummary } from "@/types";

/** Backward-compatible summary when backend has not been restarted yet. */
export function normalizeActivitySummary(
  data: Partial<ActivitySummary> | null | undefined,
): ActivitySummary | null {
  if (!data) return null;

  const ingestion = data.ingestion ?? {
    total_batches: 0,
    completed_batches: 0,
    failed_batches: data.failed_batches ?? 0,
    total_raw_rows: 0,
    by_source: {},
  };

  const pending = data.pending ?? 0;
  const pendingBlocking = data.pending_blocking ?? 0;

  return {
    total: data.total ?? 0,
    pending,
    approved: data.approved ?? 0,
    rejected: data.rejected ?? 0,
    with_blocking_issues: data.with_blocking_issues ?? 0,
    pending_blocking: pendingBlocking,
    ready_to_approve:
      data.ready_to_approve ?? Math.max(0, pending - pendingBlocking),
    suspicious: data.suspicious ?? 0,
    failed_batches: data.failed_batches ?? ingestion.failed_batches ?? 0,
    ingestion,
  };
}
