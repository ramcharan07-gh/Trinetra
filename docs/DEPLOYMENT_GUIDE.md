# TRINETRA Production Cloud Deployment Guide

**Target Architecture:**
- **Frontend Dashboard:** [Vercel](https://vercel.com) (React 18 + Vite + Tailwind + Leaflet)
- **Backend API & Engine:** [Render](https://render.com) (FastAPI + Python 3 + SQLite WAL)
- **Cost:** 100% Free Tier on both platforms.

---

## Step 0: Push Code to GitHub

All files (government UI redesign, simulation runner, `render.yaml`, `vercel.json`, and advanced tests) are already committed locally in Git (`dd93fbb`).

Run this in your PowerShell terminal to publish to GitHub:
```powershell
git push origin main
```
*(If a GitHub sign-in popup appears, click "Sign in with your browser").*

---

## Part 1: Deploy Backend to Render (5 Minutes)

Render will host your FastAPI server, run database migrations, and serve endpoints.

### 1.1 Sign In to Render
1. Open [https://render.com](https://render.com).
2. Click **GET STARTED FOR FREE** (or **Sign In**).
3. Choose **GitHub** to authenticate.

### 1.2 Create the Web Service
1. In the Render Dashboard, click the blue **New +** button in the top right.
2. Select **Web Service**.
3. Under **Connect a repository**, find your `Trinetra` repository and click **Connect**.
   *(If not listed, click "Configure GitHub App" to grant access to Trinetra).*

### 1.3 Configure the Web Service
Fill out the form with these exact settings:
- **Name:** `trinetra-backend`
- **Region:** `Singapore` (or nearest region)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`
- **Build Command:**
  ```bash
  pip install -r requirements.txt && python ../database/apply_migrations.py && python ../database/seed/seed_madanapalle.py
  ```
- **Start Command:**
  ```bash
  python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Instance Type:** Select **Free** ($0/month).

### 1.4 Set Environment Variables
Scroll to **Environment Variables** and add:
| Key | Value |
|---|---|
| `CORS_ORIGINS` | `*` |
| `DB_PATH` | `../trinetra.db` |
| `PYTHON_VERSION` | `3.11.8` |

### 1.5 Deploy
1. Click **Create Web Service**.
2. Render will show the live build output (installs dependencies, runs migrations 001 to 007, seeds 8 stops/12 buses, and starts uvicorn).
3. Once you see `Application startup complete`, copy your **Render URL** at the top left (e.g. `https://trinetra-backend.onrender.com`).
4. Test it in a new tab: `https://YOUR-URL.onrender.com/health` — it will return:
   ```json
   {"status":"ok","service":"TRINETRA Dispatch Backend","database":"connected","mode":"simulation"}
   ```

---

## Part 2: Deploy Frontend to Vercel (3 Minutes)

Vercel will build and host your React transport control dashboard.

### 2.1 Sign In to Vercel
1. Open [https://vercel.com](https://vercel.com).
2. Click **Sign Up** (or **Log In**).
3. Select **Continue with GitHub**.

### 2.2 Import Repository
1. In the Vercel dashboard, click **Add New...** → **Project**.
2. Find `Trinetra` in your GitHub repository list and click **Import**.

### 2.3 Configure Root Directory & Build
1. In the **Project Name** field: `trinetra`
2. Next to **Root Directory**:
   - Click **Edit**.
   - Select the `frontend` folder and click **Continue**.
3. **Framework Preset:** `Vite` (detected automatically).
4. Build command: `npm run build`
5. Output directory: `dist`

### 2.4 Add Backend URL Variable
Expand the **Environment Variables** section:
- **Key:** `VITE_API_BASE_URL`
- **Value:** Paste your Render backend URL from Part 1 (e.g., `https://trinetra-backend.onrender.com`).  
  *(Important: Do not include a trailing slash `/` at the end).*
- Click **Add**.

### 2.5 Deploy
1. Click **Deploy**.
2. Vercel will compile the TypeScript bundle in ~30 seconds.
3. Click your live domain link (e.g., `https://trinetra-yourname.vercel.app`).

