# BreathESG Backend (Django)

## Setup

**Supabase:** see [SETUP_DATABASE.md](./SETUP_DATABASE.md) — use Postgres `DATABASE_URL` in `backend/.env` (not `VITE_SUPABASE_*` on the frontend).

```powershell
cd D:\BreathESG\backend
copy .env.example .env
# Edit .env — set DATABASE_URL with your Supabase database password

python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

No virtualenv required — uses your normal `python` on PATH.

## API

- `GET /api/tenants/` — list tenants
- `POST /api/ingestion/upload/sap/` — SAP CSV upload (header `X-Tenant-ID`)
- `POST /api/ingestion/upload/utility/` — utility CSV/ZIP upload
- `POST /api/ingestion/sync/travel/` — travel bookings JSON
- `GET /api/ingestion/batches/` — ingestion batch history
- `GET /api/activities/` — normalized activities
- `GET /api/activities/summary/` — dashboard counts
- `POST /api/review/activities/{id}/approve/`
- `POST /api/review/activities/{id}/reject/`
- `GET /api/audit/events/?entity_id=...`

OpenAPI docs: `/api/docs/`

## Apps

- `tenants` — Tenant, DataSource
- `accounts` — TenantMembership
- `lookups` — LookupPlant, LookupAirport
- `ingestion` — batches, parsers, upload endpoints
- `normalization` — activities, validation, pipeline
- `review` — approve/reject + lock
- `audit` — append-only events
- `emissions` — baseline computation on approved rows
