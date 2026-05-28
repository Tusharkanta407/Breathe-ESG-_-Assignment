import { apiFetch } from "./client";
import type { AuditEvent } from "../types";

export function fetchAuditEvents(entityId?: string) {
  const qs = entityId ? `?entity_id=${entityId}` : "";
  return apiFetch<{ results?: AuditEvent[] } | AuditEvent[]>(
    `/audit/events/${qs}`,
  ).then((data) => (Array.isArray(data) ? data : (data.results ?? [])));
}
