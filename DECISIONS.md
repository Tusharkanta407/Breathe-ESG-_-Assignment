# DECISIONS.md

## Purpose
This document records key ambiguities in the assignment and how they were resolved for a 4-day prototype.  
Format used for each decision: **Context -> Options -> Choice -> Consequence**.

---

## Decision 1: SAP ingestion shape

### Context
The assignment asks to choose one SAP integration shape (IDoc, flat file, OData, BAPI) and justify it.  
The timeline is 4 days, and realism plus defensibility are weighted more than feature count.

### Options considered
- Build direct SAP connector (IDoc/OData/BAPI simulation)
- Accept flat-file exports (CSV) through upload

### Choice
Use **flat-file CSV upload** for SAP fuel and procurement ingestion.

### Consequence
- Positive: realistic for enterprise operations, fast to implement, easy to demo and defend.
- Negative: does not represent full native SAP integration complexity.
- Mitigation/next step: add connector abstraction and one native connector path in a future iteration.

---

## Decision 2: SAP subset boundary

### Context
SAP datasets can be extremely broad and tenant-specific due to custom fields and configuration.

### Options considered
- Attempt broad SAP object coverage
- Narrow to high-value subset for emissions flow

### Choice
Handle **procurement line items + fuel consumption rows** only.

### Consequence
- Positive: keeps ingestion and normalization coherent and testable in 4 days.
- Negative: excludes many SAP domains not needed for immediate prototype value.
- Mitigation/next step: expand object coverage per tenant onboarding priorities.

---

## Decision 3: Utility ingestion mode

### Context
Facilities data could come via portal CSV export, PDF bill, or API.  
Assignment explicitly expects realistic electricity handling with unit/time complexities.
Industry datasets such as Green Button are also relevant for utility-standard exports, but are less common in day-to-day facilities CSV handoffs for quick onboarding.

### Options considered
- PDF/OCR pipeline
- Utility-specific API connector
- Portal CSV/ZIP upload

### Choice
Use **portal CSV/ZIP upload** as primary utility ingestion mode.

### Consequence
- Positive: reflects common facility workflows and exposes billing/interval complexity.
- Negative: skips PDF parsing and utility-specific API contracts.
- Mitigation/next step: add OCR-assisted bill ingestion and API connectors later, and support Green Button-style import mapping for utilities that provide standardized exchange formats.

---

## Decision 4: Utility granularity handling

### Context
Utility-like exports can contain multiple resolutions and mixed measurement semantics (kW vs kWh).

### Options considered
- Force single granularity only
- Accept all files with canonical conversion strategy

### Choice
Accept multi-resolution utility files and normalize to canonical `kWh`, with reconciliation preference for `1H/1DAY`.

### Consequence
- Positive: realistic handling of billing alignment and interval variance.
- Negative: conversion assumptions can add uncertainty for unusual tariff structures.
- Mitigation/next step: track conversion provenance and expand tariff-aware calculations.

---

## Decision 5: Travel ingestion mechanism

### Context
Corporate travel systems are commonly API-driven; assignment asks for realistic handling of flights/hotels/ground transport.
Concur-style itinerary and direct-connect schemas expose category-specific payloads (flight, hotel, ground), often keyed by booking/trip identifiers, airport/location codes, and segment-level details rather than one flat record.
Navan-style booking APIs similarly return paginated booking objects where amendments/cancellations can appear as status changes over time for the same booking identity.

### Options considered
- Manual CSV upload only
- API pull with scheduled sync
- Event/webhook ingestion

### Choice
Use **scheduled API pull (daily)** with raw payload storage.

### Consequence
- Positive: enterprise-realistic, deterministic, and auditable ingestion cadence.
- Negative: not near-real-time and no webhook event handling in v1.
- Mitigation/next step: ingestion is idempotent using source trip/booking id + segment id as dedupe key; amendments or cancellations in later pulls create a new `RawRecord` linked to the same source identity, generate a new normalized version, and are flagged for analyst review before approval state changes.
- Mitigation/next step: add webhooks and incremental event sync later for lower-latency updates.

---

## Decision 6: Flight distance strategy

### Context
Travel APIs may provide airport codes without explicit distance; emissions still require distance-based inputs.

### Options considered
- Reject rows without distance
- Estimate from airport IATA pairs
- Attempt external enrichment for every missing segment

### Choice
Use **airport-pair distance derivation** when explicit distance is missing; flag unresolved codes as blocking.

### Consequence
- Positive: preserves coverage while keeping quality controls explicit.
- Negative: derived distance is an estimate and may diverge from ticketed route distance.
- Mitigation/next step: store derivation method/version and allow manual override for exceptions.

---

## Decision 7: Data model philosophy

### Context
The assignment emphasizes model quality, source-of-truth traceability, and auditability.

### Options considered
- Minimal CRUD schema with only current-state tables
- Lineage-first schema with raw + normalized + event entities

### Choice
Adopt **lineage-first modeling**: `IngestionBatch`, `RawRecord`, `NormalizedActivity`, `ValidationIssue`, `ReviewDecision`, `AuditEvent`.

### Consequence
- Positive: stronger auditor confidence and better decision defense.
- Negative: more tables and slightly higher implementation overhead.
- Mitigation/next step: keep UI and workflows narrow to offset model complexity.

---

## Decision 8: Multi-tenancy architecture

### Context
Prototype must support multiple clients and avoid cross-client data leakage.

### Options considered
- Single-tenant schema for speed
- Logical multi-tenancy with `tenant_id` on all business entities
- Isolated database per tenant

### Choice
Use **logical multi-tenancy** with strict `tenant_id` scoping.

### Consequence
- Positive: demonstrates enterprise readiness while staying implementable in 4 days.
- Negative: requires discipline in query scoping and test coverage.
- Mitigation/next step: add automated tenancy-scope tests and policy guards in service/repository layer.

---

## Decision 9: Validation strictness

### Context
Analysts need both quality control and throughput. Overly strict validation blocks work; overly loose validation harms trust.

### Options considered
- Hard-fail almost everything
- Soft-warn almost everything
- Two-level severity with blocking behavior

### Choice
Use **severity model**:
- `error` = blocking (cannot approve)
- `warning` = non-blocking (can approve with reviewer judgment)

### Consequence
- Positive: balanced operational flow with explicit risk signaling.
- Negative: requires clear rule definitions to avoid ambiguity.
- Mitigation/next step: make rule set versioned and visible in review UI.

---

## Decision 10: Approval lock behavior

### Context
Assignment requires analysts to approve rows before they are locked for audit.

### Options considered
- Allow edits after approval (mutable record)
- Immutable lock after approval with versioned correction path

### Choice
Use **immutable approval lock**; post-approval changes create new version/events rather than silent overwrite.

### Consequence
- Positive: strong audit integrity and easy change explanation.
- Negative: more complex correction workflow for users.
- Mitigation/next step: add guided “create correction version” UX in future iteration.

---

## Decision 11: What was intentionally not built in v1

### Context
Assignment explicitly rewards thoughtful omissions and tradeoff clarity.

### Options considered
- Try to build broad feature surface
- Keep narrow core and document omissions

### Choice
Intentionally exclude:
- SAP native connector (IDoc/OData/BAPI)
- Utility PDF OCR extraction
- Travel webhook/event ingestion

### Consequence
- Positive: higher confidence in delivered core flow, lower risk of brittle features.
- Negative: incomplete enterprise connector coverage in v1.
- Mitigation/next step: roadmap each omission with clear phase-2 plan.

---

## Decision 12: Emission factor baseline assumption

### Context
The assignment focuses on ingestion, normalization, and analyst review; it does not mandate a specific emissions factor registry/version for computation.

### Options considered
- Keep factor source unspecified in prototype
- Hardcode one public factor set without versioning
- Declare a baseline factor assumption with explicit version fields and overridable source metadata

### Choice
Use a **baseline emission factor assumption** for prototype calculations:
- electricity and fuel factors use a documented default factor table shipped with the app
- travel factors are category-based (flight/hotel/ground) with distance-class assumptions where needed
- every computed row stores `factor_source`, `factor_key`, and `computation_version`

### Consequence
- Positive: keeps results reproducible and reviewable while preserving flexibility for client-required factor registries.
- Negative: baseline factors may differ from client/auditor-required factors in production.
- Mitigation/next step: add tenant-configurable factor catalogs and effective-date factor versioning with re-computation support.

---

## Questions I would ask the PM (if available)
- Which utility tariff complexity is mandatory in phase 1 (flat vs TOU vs demand charges)?
- Is “analyst approve” expected at row-level only, or at batch-level signoff too?
- Should rejected rows stay editable in place, or always require a new corrected version?
- What SLA is expected for source sync latency (daily acceptable or near-real-time needed)?
- Which emission factor library is the expected baseline for review consistency?

---

## Implementation status (codebase)

All decisions above are implemented in:

- `backend/apps/ingestion/` — parsers + upload/sync endpoints
- `backend/apps/normalization/` — pipeline + validation rules
- `backend/apps/review/` — approve/reject + lock
- `backend/apps/audit/` — append-only events on ingest and review
- `frontend/src/routes/` — Overview, Upload, Ingestion, Review, Traceability (API-backed)

Run `python manage.py seed_demo` to load tenant, lookups, and `sample_data/` files.
