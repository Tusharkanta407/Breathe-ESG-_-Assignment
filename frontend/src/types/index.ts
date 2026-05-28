export interface ValidationIssue {
  id: string;
  severity: "error" | "warning";
  issue_code: string;
  message: string;
  is_blocking: boolean;
}

export interface EmissionComputation {
  id: string;
  factor_key: string;
  factor_source: string;
  co2e_kg: string;
  computation_version: string;
  computed_at: string;
}

export interface NormalizedActivity {
  id: string;
  raw_record: string;
  source_type: string;
  source_entity_type: string;
  activity_category: string;
  scope_category: string;
  activity_date: string | null;
  quantity_value: string | null;
  quantity_unit_raw: string;
  quantity_value_canonical: string | null;
  quantity_unit_canonical: string;
  currency: string;
  amount: string | null;
  facility_or_plant_code: string;
  cost_center: string;
  review_status: "pending" | "approved" | "rejected";
  is_locked: boolean;
  validation_issues: ValidationIssue[];
  emission_computations: EmissionComputation[];
  created_at: string;
}

export interface ActivitySummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  with_blocking_issues: number;
  pending_blocking: number;
  ready_to_approve: number;
  suspicious: number;
  failed_batches: number;
  ingestion: {
    total_batches: number;
    completed_batches: number;
    failed_batches: number;
    total_raw_rows: number;
    by_source: Record<string, number>;
  };
}

export interface AuditEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  actor_type: string;
  actor_id: string;
  event_payload: Record<string, unknown>;
  created_at: string;
}

export interface IngestionBatch {
  id: string;
  source_type: string;
  status: string;
  input_ref: string;
  row_count: number;
  trigger_type: string;
  error_summary?: string;
  created_at: string;
}
