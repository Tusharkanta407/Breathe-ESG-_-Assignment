# Connect Django to Supabase Postgres

## Important: do NOT use `@supabase/supabase-js` for this project

| Layer | Connects how |
|-------|----------------|
| **Frontend (React)** | Calls Django API only (`/api/...`) |
| **Backend (Django)** | `DATABASE_URL` → Supabase **Postgres** |
| **Supabase JS keys** (`VITE_SUPABASE_*`) | **Not used** — those are for direct browser → Supabase access |

Your models live in Django (`apps/*/models.py`). Tables are created with:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Step 1 — Get the Postgres connection string

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. **Project Settings** → **Database**  
3. Under **Connection string**, choose **URI**  
4. Copy the string and replace `[YOUR-PASSWORD]` with your **database password**  
   (This is NOT the `sb_publishable_...` key — that is for the JS client.)

Example host for your project:

```text
db.zhpwvunkqkrchsndkurl.supabase.co
```

**Session pooler (recommended — use on Railway/Vercel):**

Supabase Dashboard → Database → **Session pooler** URI (port **5432** on `*.pooler.supabase.com`).

```text
postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres
```

**Direct connection (local dev OK; Railway build often fails — IPv6):**

```text
postgresql://postgres:[PASSWORD]@db.zhpwvunkqkrchsndkurl.supabase.co:5432/postgres
```

If deploy logs show `2406:da18:... Network is unreachable`, switch to the **pooler** URI above.

---

## Step 2 — Create `backend/.env`

```bash
cd backend
copy .env.example .env
```

Edit `.env` and set:

```env
DATABASE_URL=postgresql://postgres:YOUR_REAL_PASSWORD@db.zhpwvunkqkrchsndkurl.supabase.co:5432/postgres
```

Never commit `.env` to GitHub.

---

## Step 3 — Install Python deps & create tables (no venv)

```powershell
cd D:\BreathESG\backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

`seed_demo` prints the **Tenant ID** — paste it in the frontend header.

---

## Step 4 — Verify connection

```bash
python manage.py check
python manage.py showmigrations
```

If migrate fails with SSL/connection errors, try the **pooler** URL (port 6543) from the Supabase dashboard.

---

## Security note

If you shared API keys in chat, rotate them in Supabase → **Settings** → **API**.
