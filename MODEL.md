# MODEL.md

## Modeling goals
The data model is designed to optimize four requirements from the assignment:
- multi-tenancy isolation
- source-of-truth traceability
- unit normalization and consistent computation inputs
- analyst review + approval lock + audit trail

The model favors explicit lineage and auditability over aggressive denormalization.

---

## Core entities

### `Tenant`
- Represents one client company.
- Every business row includes `tenant_id` to enforce hard logical isolation.

### `DataSource`
- One configured source per tenant and source type.
- Key fields: `source_type` (`sap`, `utility`, `travel`), `name`, `is_active`, `config_version`.

### `IngestionBatch`
- One ingestion run (file upload or API sync execution).
- Key fields: `batch_id`, `tenant_id`, `data_source_id`, `trigger_type` (`manual_upload`, `scheduled_pull`), `status`, `started_at`, `finished_at`, `input_ref`.
- Purpose: operational observability and replay/debug anchor.

### `RawRecord`
- Immutable copy of each incoming source row/payload.
- Key fields: `raw_record_id`, `batch_id`, `source_row_key`, `raw_payload` (JSON), `parse_status`, `parse_error`.
- Purpose: preserve source-of-truth and allow re-normalization without re-ingesting.

### `NormalizedActivity`
- Canonical activity row used by analyst review and emissions pipeline.
- Key fields:
  - identity: `activity_id`, `tenant_id`, `raw_record_id`, `source_type`, `source_entity_type`
  - time: `activity_start`, `activity_end`, `activity_date`
  - business dimensions: `scope_category` (`scope1`, `scope2`, `scope3`), `activity_category` (`fuel`, `purchased_electricity`, `flight`, `hotel`, `ground_transport`, `procurement`)
  - measured values: `quantity_value`, `quantity_unit_raw`, `quantity_value_canonical`, `quantity_unit_canonical`
  - finance/context: `currency`, `amount`, `facility_or_plant_code`, `cost_center`
  - governance: `normalization_version`, `is_locked`

### `ValidationIssue`
- Records rule outcomes attached to normalized activities.
- Key fields: `issue_id`, `activity_id`, `severity` (`error`, `warning`), `issue_code`, `message`, `is_blocking`, `rule_version`.

### `ReviewDecision`
- Analyst decision record.
- Key fields: `decision_id`, `activity_id`, `reviewer_id`, `decision` (`approve`, `reject`), `comment`, `decided_at`.
- Constraint: approve allowed only when no blocking issues remain.

### `AuditEvent`
- Append-only activity and ingestion timeline.
- Key fields: `event_id`, `tenant_id`, `entity_type`, `entity_id`, `event_type`, `actor_type`, `actor_id`, `event_payload`, `created_at`.
- Used for auditor-facing trace reconstruction.

### `LookupPlant`
- Plant code dictionary for SAP/facility mapping.
- Key fields: `tenant_id`, `plant_code`, `plant_name`, `country_code`, `is_active`.

### `LookupAirport`
- IATA-to-location and distance helper for travel normalization.
- Key fields: `iata_code`, `city`, `country_code`, `lat`, `lon`.

### `EmissionComputation` (v1-ready structure)
- Stores computed emissions linked to normalized activity.
- Key fields: `computation_id`, `activity_id`, `factor_key`, `factor_source`, `co2e_kg`, `computation_version`, `computed_at`.
- Included so emissions math remains versioned and reproducible.

---

## Relationship summary
- `Tenant` 1:N `DataSource`
- `DataSource` 1:N `IngestionBatch`
- `IngestionBatch` 1:N `RawRecord`
- `RawRecord` 1:0..1 `NormalizedActivity`
- `NormalizedActivity` 1:N `ValidationIssue`
- `NormalizedActivity` 1:N `ReviewDecision`
- `NormalizedActivity` 1:N `AuditEvent`
- `NormalizedActivity` 1:0..N `EmissionComputation`

This creates a strict lineage chain:
`NormalizedActivity -> RawRecord -> IngestionBatch -> DataSource -> Tenant`.

---

## Multi-tenancy strategy
- All tenant-owned tables include `tenant_id`.
- Read/write queries are always filtered by `tenant_id`.
- Natural keys are tenant-scoped where applicable (for example, plant code uniqueness).
- Cross-tenant joins are disallowed in application-level repository/service methods.

Rationale: clear, testable tenant boundaries are required for enterprise trust.

---

## Scope 1/2/3 categorization approach
- `scope_category` is stored explicitly on each normalized activity, not inferred only at query time.
- Mapping logic is rule-driven by `source_type + activity_category`.
- Examples:
  - fuel combustion -> `scope1`
  - purchased electricity -> `scope2`
  - flights/hotels/ground transport -> `scope3`
- If mapping cannot be resolved, activity is flagged with blocking validation issue.

Rationale: explicit stored categorization improves explainability in analyst and audit workflows.

---

## Unit normalization strategy
- Preserve original value/unit (`quantity_value`, `quantity_unit_raw`).
- Store canonical value/unit separately (`quantity_value_canonical`, `quantity_unit_canonical`).
- Conversion logic is versioned via `normalization_version` and referenced in issues/events when applied.
- Unsupported conversion paths create blocking issues instead of silent assumptions.

Rationale: dual storage avoids data loss and supports audit replay.

---

## Review and lock lifecycle
1. Ingestion creates `RawRecord`.
2. Normalization creates `NormalizedActivity`.
3. Validation populates `ValidationIssue`.
4. Analyst reviews and creates `ReviewDecision`.
5. On approval:
   - `is_locked = true` on `NormalizedActivity`
   - `AuditEvent` records lock event.
6. Any post-lock correction is modeled as a new activity version + new audit events, never silent overwrite.

Rationale: approved rows must be immutable from an auditor perspective.

---

## Audit trail guarantees
- Every state transition writes an `AuditEvent`.
- `RawRecord` payloads are immutable after write.
- `ReviewDecision` rows are append-only (changes are new rows, not updates).
- Each normalized row can be traced back to exact source input and ingestion batch execution.

---

## Implementation map (code)

| Document entity | Django app / model |
|-----------------|-------------------|
| Tenant, DataSource | `apps.tenants` |
| IngestionBatch, RawRecord | `apps.ingestion` |
| NormalizedActivity, ValidationIssue | `apps.normalization` |
| ReviewDecision | `apps.review` |
| AuditEvent | `apps.audit` |
| EmissionComputation | `apps.emissions` |
| LookupPlant, LookupAirport | `apps.lookups` |
