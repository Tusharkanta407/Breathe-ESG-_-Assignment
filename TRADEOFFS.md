# TRADEOFFS.md

## Purpose
This document lists three features deliberately not built in the 4-day prototype, why they were deferred, the risk introduced by deferring them, and how they would be implemented next.

The guiding principle was: prioritize a reliable end-to-end analyst workflow (ingest -> normalize -> review -> approve -> lock -> audit trace) over broad but fragile integrations.

---

## Tradeoff 1: No native SAP connector (IDoc/OData/BAPI) in v1

### What was not built
- A direct SAP integration path such as IDoc, OData service, or BAPI connector.

### Why this was deferred
- SAP integrations are highly environment-specific and require deeper system assumptions than this prototype timeline allows.
- Building a realistic, robust connector in 4 days would reduce quality in core data modeling and audit behavior, which are more heavily weighted in grading.
- CSV import still captures realistic SAP/Ariba operational complexity (custom headers, inconsistent formats, tenant-specific schema drift).

### Risk introduced
- More manual operational effort for source data handoff.
- Connector-level failures (auth, endpoint changes, retries) are not exercised in v1.
- Some enterprise stakeholders may view CSV-only ingestion as less mature.

### How to address in next iteration
- Add source connector abstraction and implement one native SAP path first (recommended: OData).
- Introduce connector health, retry policy, and structured ingestion error telemetry.
- Keep CSV path as fallback and onboarding bootstrap option.

---

## Tradeoff 2: No utility PDF bill OCR in v1

### What was not built
- Parsing utility invoices from PDF using OCR and post-extraction mapping.

### Why this was deferred
- OCR introduces high variance and requires a dedicated confidence + human-correction loop to avoid low-trust outputs.
- For this prototype, portal CSV/ZIP ingestion already demonstrates the required electricity challenges: interval granularity, kW vs kWh, timezone alignment, and non-calendar billing windows.
- Deferring OCR allowed stronger implementation of normalization and analyst review controls.

### Risk introduced
- Clients with PDF-only workflows cannot fully automate ingestion in v1.
- Manual preprocessing may be needed to transform PDFs into structured files.
- Billing metadata extraction coverage is narrower than in production-grade systems.

### How to address in next iteration
- Add OCR pipeline with confidence scoring and field-level review UI.
- Support hybrid ingestion: PDF + human verification + canonical record generation.
- Capture extracted-source confidence in audit trail for transparency.

---

## Tradeoff 3: No travel webhooks / near-real-time sync in v1

### What was not built
- Event-driven travel updates via webhook subscriptions and low-latency incremental processing.

### Why this was deferred
- Scheduled API pulls are simpler to make deterministic and auditable in a short prototype window.
- Daily sync is sufficient to demonstrate realistic flight/hotel/ground normalization and emissions preparation.
- Webhook infrastructure requires additional complexity (signature validation, idempotency, replay handling, dead-letter strategy).

### Risk introduced
- Booking changes may appear with delay between sync windows.
- Potential temporary mismatch between source system state and review dashboard.
- Manual re-sync may be required for urgent audit deadlines.

### How to address in next iteration
- Add webhook receiver with signature validation and idempotency keys.
- Combine webhooks with periodic backfill sync for resilience.
- Add freshness SLA metrics in operations dashboard.

---

## Why these tradeoffs are deliberate (not gaps by accident)
- They remove high-complexity integration surfaces that would likely reduce core prototype quality.
- They preserve focus on the assignment's highest-scoring dimensions: data model quality, traceability, and decision defensibility.
- Each omitted area has a clear and realistic phase-2 implementation path.

---

## What we did build instead (v1 scope)

- End-to-end path: ingest → normalize → validate → review → approve → lock → audit event
- Three realistic source adapters (SAP CSV, utility CSV, travel JSON sync)
- Baseline emission computation on approved rows (`apps/emissions`)
- Analyst UI with tenant scoping via `X-Tenant-ID`
