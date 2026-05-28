import { unwrapList } from "@/lib/api-utils";
import { normalizeActivitySummary } from "@/lib/summary";
import type { ActivitySummary, NormalizedActivity } from "../types";
import { apiFetch } from "./client";

export function fetchActivities(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return apiFetch<NormalizedActivity[] | { results: NormalizedActivity[] }>(
    `/activities/${qs}`,
  ).then(unwrapList);
}

export function fetchSummary() {
  return apiFetch<Partial<ActivitySummary>>("/activities/summary/").then(
    normalizeActivitySummary,
  );
}

export function approveActivity(id: string, comment = "") {
  return apiFetch(`/review/activities/${id}/approve/`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export function rejectActivity(id: string, comment = "") {
  return apiFetch(`/review/activities/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export function revalidateActivity(id: string) {
  return apiFetch<import("../types").NormalizedActivity>(
    `/review/activities/${id}/revalidate/`,
    { method: "POST" },
  );
}
