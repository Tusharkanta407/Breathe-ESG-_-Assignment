import type { IngestionBatch } from "@/types";
import type { ActivitySummary } from "@/types";

export function computeIngestionFromBatches(batches: IngestionBatch[]) {
  const totalBatches = batches.length;
  const rowsImported = batches.reduce((sum, b) => sum + (b.row_count ?? 0), 0);
  const completedBatches = batches.filter((b) => b.status === "completed").length;
  const failedBatches = batches.filter((b) => b.status === "failed").length;
  return { totalBatches, rowsImported, completedBatches, failedBatches };
}

export function mergeSummaryWithBatches(
  summary: ActivitySummary | null | undefined,
  batches: IngestionBatch[],
): ActivitySummary | null {
  if (!summary) return null;
  const fromBatches = computeIngestionFromBatches(batches);
  const apiIngestion = summary.ingestion;
  const useApi =
    apiIngestion &&
    (apiIngestion.total_batches > 0 || apiIngestion.total_raw_rows > 0);

  return {
    ...summary,
    failed_batches: useApi
      ? apiIngestion.failed_batches
      : fromBatches.failedBatches,
    ingestion: useApi
      ? apiIngestion
      : {
          total_batches: fromBatches.totalBatches,
          completed_batches: fromBatches.completedBatches,
          failed_batches: fromBatches.failedBatches,
          total_raw_rows: fromBatches.rowsImported,
          by_source: apiIngestion?.by_source ?? {},
        },
  };
}
