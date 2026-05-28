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
| `CORS_ALLOW_ALL_ORIGINS` | `true` (demo) |

4. **Deploy settings** (Settings → Deploy):

**Build command:**
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput && python manage.py seed_demo
```

**Start command:**
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

5. Copy public URL, e.g. `https://breathesg-api-production.up.railway.app`
6. Test: `https://YOUR-RAILWAY-URL/api/docs/`

---

## 3. Vercel — React frontend

1. [vercel.com](https://vercel.com) → **Add New Project** → import same GitHub repo
2. **Root Directory** = `frontend`
3. **Framework Preset** = Vite (or Other)
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist/client` (if build fails, check `frontend/dist/` after local `npm run build`)
6. **Environment variable:**

| Name | Value |
|------|--------|
| `VITE_API_BASE` | `https://YOUR-RAILWAY-URL/api` |

7. Deploy → copy URL, e.g. `https://breathesg.vercel.app`

8. **Redeploy** frontend after Railway URL is final (if you changed `VITE_API_BASE`).

---

## 4. Connect frontend ↔ backend

- Frontend calls `VITE_API_BASE` + `/activities/`, etc.
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
| Frontend | `npm run dev` (proxies `/api` → :8000) | Vercel + `VITE_API_BASE` |
| Backend | `python manage.py runserver` | Railway + gunicorn |
| DB | `backend/.env` `DATABASE_URL` | Railway env `DATABASE_URL` |
