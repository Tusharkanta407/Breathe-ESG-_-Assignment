# BreathESG Frontend

React + TanStack Router UI connected to the Django API (no mock data).

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Backend must run on `http://127.0.0.1:8000` (Vite proxies `/api`).

```bash
cd ../backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Paste the tenant UUID from `seed_demo` into the header field (or it auto-loads the first tenant).

## Pages (live API)

| Route | API |
|-------|-----|
| `/` | `GET /api/activities/summary/`, batches, flagged activities |
| `/upload` | `POST /api/ingestion/upload/sap|utility`, `sync/travel` |
| `/ingestion` | `GET /api/ingestion/batches/` |
| `/review` | `GET /api/activities/`, approve/reject |
| `/traceability` | activities + `GET /api/audit/events/` |
