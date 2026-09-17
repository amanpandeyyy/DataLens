# Deploying DataLens on Render (Render.com)

This guide walks you through deploying **DataLens — AI Data Analyst** to [Render](https://render.com) for free.

---

## Method 1: Unified Docker Web Service (Recommended — 100% Free & Simplest)

In this approach, the React frontend is compiled and served directly by the FastAPI Python backend under a single URL (`https://your-app.onrender.com`).
* **Only 1 Free Web Service needed on Render**.
* **Zero CORS issues**.
* **1 single clean URL for both the UI and API**.

### Step 1: Push your Code to GitHub
1. Initialize git and commit your latest changes if not already done:
   ```bash
   git add .
   git commit -m "Configure production deployment for Render"
   ```
2. Create a new repository on [GitHub](https://github.com/new) (public or private).
3. Push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create a Web Service on Render
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click the **"New +"** button in the top navigation and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and click **Next**.
4. Connect your GitHub account and select your `AI_Data_Analyst` repository.

### Step 3: Configure Service Settings
Fill in the following fields:
* **Name**: `datalens-ai-analyst` (or any unique name you like)
* **Region**: Choose the closest region to you (e.g., *Oregon (US West)* or *Frankfurt (EU)*)
* **Branch**: `main`
* **Root Directory**: *(Leave blank)*
* **Runtime**: Select **Docker** (Render will automatically detect the root `Dockerfile`)
* **Instance Type**: Select **Free**

### Step 4: Add Environment Variables
Under the **Environment Variables** section, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Production mode |
| `APP_NAME` | `DataLens` | Application name |
| `AI_PROVIDER` | `demo` | Built-in offline deterministic intelligence (no API keys needed!) |
| `SECRET_KEY` | *(Click "Generate" on Render)* | Random JWT secret |
| `DATABASE_URL` | `sqlite:////app/data/datalens.db` | Persistent SQLite path |

*(Optional)* If you want to use OpenAI or Anthropic instead of the built-in demo engine:
* `OPENAI_API_KEY`: `sk-...`
* `AI_PROVIDER`: `openai`

### Step 5: Deploy
Click **"Create Web Service"**.
Render will build the Docker container (installing Node, building the React app, installing Python packages) and launch the server.
Once the build completes, you will see a green **"Live"** badge with your public URL:
👉 `https://datalens-ai-analyst.onrender.com`

---

## Method 2: Render Blueprint (Infrastructure-as-Code)

If your repository has `render.yaml` (which is already included in this project):
1. In the Render Dashboard, click **"New +"** $\rightarrow$ **"Blueprint"**.
2. Connect your GitHub repository.
3. Render will read `render.yaml` and configure the Docker Web Service automatically.
4. Click **"Apply"** to start the build.

---

## Method 3: Split Deployment (Backend Web Service + Frontend Static Site)

If you prefer deploying the Backend and Frontend as two independent services:

### 1. Backend (Web Service)
* **Runtime**: Python 3
* **Root Directory**: `backend`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables**:
  * `PYTHONPATH`: `.`
  * `APP_ENV`: `production`
  * `SECRET_KEY`: *(Generate)*
  * `AI_PROVIDER`: `demo`
* Copy the resulting backend URL (e.g. `https://datalens-api.onrender.com`).

### 2. Frontend (Static Site)
* In Render, click **"New +"** $\rightarrow$ **"Static Site"**.
* **Root Directory**: `frontend`
* **Build Command**: `npm install && npm run build`
* **Publish Directory**: `dist`
* **Environment Variables**:
  * `VITE_API_BASE_URL`: `https://datalens-api.onrender.com` (your backend URL)
* **Redirects / Rewrites** (in Render settings):
  * **Source**: `/*`
  * **Destination**: `/index.html`
  * **Action**: `Rewrite` (ensures browser reload works on SPA routes)

---

## Verifying your Live Site

Once deployed:
1. Open your live Render URL in any browser.
2. Click **"Try Sample Dataset"** on the dashboard to test instant in-memory DuckDB loading.
3. Try asking a question in **"Chat with your data"** or inspecting columns in **"Overview"**.
4. Test **"Download Cleaned Data"** and **"Generate PDF Report"**.
