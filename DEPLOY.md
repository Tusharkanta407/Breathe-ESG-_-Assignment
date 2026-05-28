# Deploy: Railway (API) + Vercel (frontend)

## Before you push to GitHub

- [ ] `backend/.env` is **not** in git (only `.env.example`)
- [ ] Removed internal files: `task.md`, `SUBMISSION.md`, `RECRUITER_TEST.md`
- [ ] Keep for reviewers: `MODEL.md`, `DECISIONS.md`, `SOURCES.md`, `TRADEOFFS.md`, `README.md`

---

## 1. GitHub

```powershell
cd D:\BreathESG
git init
git add .
git status
# Confirm .env and node_modules are NOT listed
git commit -m "BreathESG: ESG ingestion and analyst review prototype"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

Share repo with: saurav@breatheesg.com, rahul@breatheesg.com, shivang@breatheesg.com

---

## 2. Railway — Django API

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Add a service → set **Root Directory** = `backend`
3. **Variables:**

| Variable | Value |
|----------|--------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.prod` |
| `SECRET_KEY` | long random string |
| `DATABASE_URL` | Supabase Postgres URI (`@` in password → `%40`) |
| `ALLOWED_HOSTS` | `*` (or your Railway domain) |
| `CORS_ALLOW_ALL_ORIGINS` | `true` (demo — **do not** set `CORS_ALLOWED_ORIGINS=true`) |
| `CORS_ALLOWED_ORIGINS` | leave empty, or your Vercel URL e.g. `https://yourapp.vercel.app` |

4. **DATABASE_URL — use Supabase pooler (required on Railway)**

Direct host `db.xxx.supabase.co` often resolves to **IPv6**. Railway cannot reach it → `Network is unreachable`.

In Supabase: **Project Settings → Database → Connection string → URI → Session pooler** (not “Direct”).

Example shape (your region/host will differ):

```text
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Password: URL-encode `@` as `%40`.

5. **Deploy settings** (Settings → Deploy):

**Build command** (no DB access during build):
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput
```

**Start command** (migrate + seed when container runs — DB reachable here):
```bash
sh start.sh
```

Or manually:
```bash
python manage.py migrate --noinput && python manage.py seed_demo || true && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

5. Copy public URL, e.g. `https://breathesg-api-production.up.railway.app`
6. Test: `https://YOUR-RAILWAY-URL/api/docs/`

---

## 3. Vercel — React frontend

1. [vercel.com](https://vercel.com) → **Add New Project** → import same GitHub repo
2. **Root Directory** = `frontend` ← important (not repo root)
3. **Framework Preset** = **Other**
4. **Build Command:** `npm run build:vercel` (in `frontend/vercel.json` — creates `dist/index.html`)
5. **Output Directory:** `dist`  
   (Do **not** use `dist/client` — no `index.html` → Vercel `404: NOT_FOUND`.)
6. **No frontend env var required on Vercel** — the app calls same-origin `/api`; `frontend/vercel.json` rewrites `/api/*` → Railway.

   Optional **local dev only** (`frontend/.env`): `VITE_API_BASE=https://…up.railway.app/api` so `npm run dev` proxies `/api` to Railway when Django is not running.

7. Deploy → open your `*.vercel.app` URL

### Redeploy on Vercel (after code or env change)

1. Push latest code to GitHub (`frontend/vite.config.ts` has `nitro: { preset: "vercel" }`)
2. Vercel → your project → **Deployments**
3. ⋮ on latest → **Redeploy** (or push to `main` auto-deploys)
4. Confirm **Root Directory** = `frontend` under Settings → General
5. Ensure `frontend/vercel.json` is deployed ( `/api` → Railway rewrite )

### If build fails on Vercel

- Node version **20+** in Project Settings
- Build logs: `nitro` / `.vercel/output` should appear at end of `npm run build`

---

## 4. Connect frontend ↔ backend

- Frontend always calls same-origin `/api/...` (Vercel rewrite or Vite dev proxy → Railway/local Django).
- Header should show **Client → Demo Corp** once `GET /api/tenants/` succeeds (same URL you tested on Railway).
- Railway must be up; Supabase `DATABASE_URL` must be set on Railway.
- In the live app: header **Client → Demo Corp** (auto-selected after `seed_demo` on Railway build).

---

## 5. Submission email

**Subject:** BreathESG submission — [Your Name]

- **GitHub:** repo link  
- **Live app:** Vercel URL  
- **API docs:** Railway URL + `/api/docs/`  
- **Demo:** Client = Demo Corp; optional note that auth is open for prototype (`DECISIONS.md`)

---

## Local vs production

| | Local | Production |
|---|--------|--------------|
| Frontend | `npm run dev` (`/api` → :8000 or Railway via `.env`) | Vercel (`vercel.json` `/api` rewrite) |
| Backend | `python manage.py runserver` | Railway + gunicorn |
| DB | `backend/.env` `DATABASE_URL` | Railway env `DATABASE_URL` |
