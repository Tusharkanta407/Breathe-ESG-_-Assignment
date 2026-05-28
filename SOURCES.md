# SOURCES.md

## Purpose
This document captures the real-world source formats researched for the prototype, what subset is implemented in 4 days, how sample data was designed, and where a real deployment would break.

---

## 1) SAP (fuel + procurement)

### Real-world format researched
- SAP/Ariba import formats are template-driven and environment-specific, not one universal schema.
- Requisition-style import preparation in Ariba commonly relies on CSV flows and custom fields that vary per tenant/site.
- In practice, teams often exchange flat files (CSV/Excel-derived) for operational imports/exports, even when deeper integration options exist.

References:
- [SAP Help Portal](https://help.sap.com/docs/buying-invoicing/common-data-import-and-administration-for-sap-ariba-procurement-solutions/contract-csv-format-6a9679d2c1da10149694ee4ea07e5d2a)
- [SAP Community: Requisition import CSV prep](https://community.sap.com/t5/spend-management-blog-posts-by-sap/blazing-fast-way-to-prepare-requisition-import-csvs-in-sap-ariba-b-amp-i/ba-p/14120733)

### Chosen ingestion mode + why
- **Chosen mode:** CSV file upload.
- **Why this choice:** For a 4-day prototype, CSV is the highest realism-to-delivery ratio. It represents actual operational handoffs and still exposes messy enterprise data quality issues.
- **Implementation pattern:** file upload -> tenant mapping profile -> async parse/validate -> raw storage + normalized output.

### Sample data fields included (and why)
- Procurement rows: `document_number`, `line_item`, `plant_code`, `material_group`, `quantity`, `unit`, `net_amount`, `currency`, `cost_center`, `posting_date`.
- Fuel rows: `plant_code`, `fuel_type`, `volume_or_mass`, `unit`, `supplier`, `delivery_date`, `invoice_ref`.
- Messiness intentionally added:
  - mixed headers (`plant_code`, `Werk`, `Kostenstelle`)
  - mixed date formats (`YYYY-MM-DD`, `DD.MM.YYYY`, `MM/DD/YYYY`)
  - mixed units (`L`, `gal`, `kg`, `t`)
  - nullable `cost_center`

### Normalization and validation rules
- Header alias mapping (English/German variants) to canonical fields.
- Unit normalization to canonical units (`L`/`kg` depending on fuel category).
- Plant code validation via lookup table; unknown codes flagged.
- Date parser with format fallbacks; parse failures become blocking issues.
- Missing critical fields (`date`, `quantity`, `unit`, `source reference`) become blocking issues.

### What breaks in real deployment + next step
- Breakpoint: one CSV profile is insufficient for highly customized SAP landscapes.
- Breakpoint: no direct IDoc/OData/BAPI connector in v1.
- Next step: add connector abstraction and support one native SAP integration path (OData or IDoc) with tenant-specific mapping governance.

---

## 2) Utility data (electricity)

### Real-world format researched
- Utility/facilities workflows often export electricity usage as CSV from portals/apps.
- Exports can include multiple resolutions in one package (e.g., 15-min, hourly, daily).
- Power vs energy units vary by file granularity (kW vs kWh), and billing windows often do not align to calendar month boundaries.

Reference:
- [Emporia Energy: Exporting and analyzing data](https://help.emporiaenergy.com/en/articles/13274862-exporting-and-analyzing-data)

### Chosen ingestion mode + why
- **Chosen mode:** ZIP/CSV upload from utility portal-style export.
- **Why this choice:** It reflects the most common facilities-team workflow and captures realistic reconciliation complexity without requiring OCR or utility-specific API contracts.
- **Implementation pattern:** upload ZIP/CSV -> parse multiple resolution files -> prefer `1H`/`1DAY` for billing reconciliation -> normalize.

### Sample data fields included (and why)
- `meter_id`, `channel_name`, `interval_start`, `interval_end`, `reading_value`, `reading_unit`, `timezone`, `tariff_code`, `billing_period_start`, `billing_period_end`.
- Included channel suffix patterns (`_A`, `_B`, `_C`) to simulate multi-phase mains.
- Included both kW interval rows and kWh hourly/daily rows to force conversion/aggregation logic.

### Normalization and validation rules
- Normalize all usable energy records to canonical `kWh`.
- Convert interval power (`kW`) to energy where interval duration is known.
- Enforce timezone handling before billing alignment.
- Flag overlapping billing periods and gaps between consecutive periods.
- Flag unsupported units and missing meter identifiers.

### What breaks in real deployment + next step
- Breakpoint: PDF bills and OCR extraction are not handled in v1.
- Breakpoint: tariff complexity is only shallowly modeled (basic metadata, not full charge decomposition).
- Next step: add bill document ingestion (PDF + OCR + human confirmation) and tariff-aware cost reconciliation.

---

## 3) Corporate travel (flights, hotels, ground)

### Real-world format researched
- Enterprise travel platforms expose itinerary/booking data by API.
- Records differ by travel category (flight vs hotel vs ground transport), with different emissions inputs.
- Airport IATA codes are common in travel payloads; explicit distance may be absent and requires derivation.

References:
- [Concur Itinerary API guide](https://github.com/SAP-docs/preview.developer.concur.com/blob/main/src/api-guides/tmc/itinerary-v1-guide.markdown)
- [Concur Hotel Service v4 schema](https://preview.developer.concur.com/api-reference/direct-connects/hotel-service-4/v4.schemas.html)
- [Concur Ground Transportation request format](https://preview.developer.concur.com/api-reference/direct-connects/ground-transportation/post-transportation-search.html)

### Chosen ingestion mode + why
- **Chosen mode:** scheduled API pull (daily) from Concur-style endpoint contract.
- **Why this choice:** Travel is API-centric in enterprise environments, and scheduled pulls give deterministic ingestion behavior for auditability.
- **Implementation pattern:** scheduled sync -> store raw payload -> category-specific normalization -> validation/flags.

### Sample data fields included (and why)
- Shared: `booking_id`, `traveler_id`, `booking_type`, `currency`, `total_amount`, `status`.
- Flight: `origin_iata`, `destination_iata`, `departure_ts`, `arrival_ts`, `cabin_class`, optional `distance_km`.
- Hotel: `property_name`, `city`, `checkin_date`, `checkout_date`, `nights`.
- Ground: `pickup_type` (address/airport/station), `pickup_code_or_address`, `dropoff_type`, `dropoff_code_or_address`.

### Normalization and validation rules
- Map `booking_type` to canonical activity categories and Scope 3 travel classes.
- Derive flight distance from airport pair lookup when explicit distance is missing.
- Flag unresolved airport codes as blocking for flight emissions computation.
- Validate temporal consistency (check-in < check-out, departure < arrival).
- Detect duplicates by source booking id + segment identifiers.

### What breaks in real deployment + next step
- Breakpoint: no live OAuth/token refresh integration in prototype.
- Breakpoint: no webhook/event-driven updates (only scheduled polling).
- Next step: production connector with OAuth lifecycle, retries/rate-limit handling, and webhook-driven near-real-time updates.

---

## Sample files in this repo (`sample_data/`)

| File | Purpose |
|------|---------|
| `sap_sample.csv` | Mixed English/German headers, L/gal/t units, fuel + procurement rows |
| `utility_sample.csv` | Portal-style kWh readings with billing period fields |
| `travel_sample.json` | Flight (DEL–BOM) + hotel stay; Concur/Navan-like shape |

Loaded automatically via `python manage.py seed_demo` → `seed_sample_files`.

---

## Why these source choices are appropriate for this assignment
- They are realistic enough to reflect enterprise messiness.
- They preserve defensible scope boundaries for a 4-day build.
- They align directly with evaluation criteria: source realism, judgment, and clarity on what is intentionally not built.

