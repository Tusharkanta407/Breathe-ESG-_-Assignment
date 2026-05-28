# BreathESG

Enterprise ESG data prototype: ingest SAP, utility, and travel data → normalize → analyst review → approve and lock for audit.

## Live demo

- **App:** https://breathe-esg-assignment-eosin.vercel.app/
- **API docs:** https://breathe-esg-assignment-production-2051.up.railway.app/api/docs/

## Documentation (assignment deliverables)

| Document | Description |
|----------|-------------|
| [MODEL.md](./MODEL.md) | Data model, multi-tenancy, scopes, audit |
| [DECISIONS.md](./DECISIONS.md) | Design choices and PM trade-offs |
| [SOURCES.md](./SOURCES.md) | Real-world source research |
| [TRADEOFFS.md](./TRADEOFFS.md) | What we deliberately did not build |

## Stack

- **Backend:** Django 5, Django REST Framework, PostgreSQL (Supabase)
- **Frontend:** React, TanStack Router, Vite, Tailwind

## Local development

**Backend**

```powershell
cd backend
python -m pip install -r requirements.txt
copy .env.example .env
# Edit .env: set DATABASE_URL (Supabase)
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

**Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — choose **Client → Demo Corp** in the header.

Sample files in `sample_data/` are loaded by `seed_demo`.

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Railway (API) + Vercel (frontend).

## Project layout

```
backend/       Django apps: ingestion, normalization, review, audit
frontend/      Analyst console UI
sample_data/   SAP CSV, utility CSV, travel JSON samples
```
