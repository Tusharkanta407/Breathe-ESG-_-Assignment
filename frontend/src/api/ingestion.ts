import { unwrapList } from "@/lib/api-utils";
import type { IngestionBatch } from "../types";
import { apiFetch } from "./client";

export function fetchBatches() {
  return apiFetch<IngestionBatch[] | { results: IngestionBatch[] }>(
    "/ingestion/batches/",
  ).then(unwrapList);
}

export function uploadSap(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<IngestionBatch>("/ingestion/upload/sap/", {
    method: "POST",
    body: form,
  });
}

export function uploadUtility(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<IngestionBatch>("/ingestion/upload/utility/", {
    method: "POST",
    body: form,
  });
}

export function syncTravel(bookings: unknown[]) {
  return apiFetch<IngestionBatch>("/ingestion/sync/travel/", {
    method: "POST",
    body: JSON.stringify({ bookings }),
  });
}
