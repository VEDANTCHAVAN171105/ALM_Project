# ALM — Audio Language Model

A localhost-runnable audio intelligence workstation that understands speech, sound events, emotion, environment, and anomalies from a single audio clip.

## Architecture

```text
           +---------------------------+
           |   React Workstation UI    |
           |  Record / Upload / View   |
           +------------+--------------+
                        |
                        v
           +---------------------------+
           | FastAPI /api/analyze      |
           | multipart audio ingestion |
           +------------+--------------+
                        |
                        v
      +----------------------------------------+
      | Unified Pipeline                       |
      | 1. Validate size + extension           |
      | 2. Load audio with librosa             |
      | 3. Resample + noise reduction          |
      | 4. Quality metrics + silence check     |
      | 5. Gemini audio reasoning              |
      | 6. Merge structured ALM response       |
      +----------------+-----------------------+
                       |
          +------------+------------+
          |                         |
          v                         v
 +--------------------+   +----------------------+
 | PostgreSQL / SQLite|   | JSON API Response    |
 | session history    |   | rich report to UI    |
 +--------------------+   +----------------------+
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Gemini API key

## Setup

```bash
# 1. Clone / unzip project
cd alm-project

# 2. Backend setup
cd backend
python -m venv .venv

# Windows:
.\.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 3. Create environment file
# Windows PowerShell: Copy-Item .env.example .env
# Windows Command Prompt: copy .env.example .env
# Mac/Linux: cp .env.example .env
# Then set GEMINI_API_KEY and a private JWT_SECRET in backend/.env

# 4. Run backend
python -m uvicorn main:app --reload --port 8000

# 5. Frontend setup (new terminal)
cd alm-project/frontend
npm ci
npm start
# Opens at http://localhost:3000

# 6. Verify backend is running
# Open: http://localhost:8000/api/health
```

## Get a Free Gemini API Key

1. Open [Google AI Studio](https://aistudio.google.com).
2. Sign in with a Google account.
3. Create an API key from the API keys section.
4. Paste it into `backend/.env` as `GEMINI_API_KEY=...`.

The backend loads `backend/.env` first and then the project-root `.env` for any
settings not already supplied. A value exported in the shell takes precedence
over both files.

## Run Both Servers

Backend:

```bash
cd alm-project/backend
# Activate the virtual environment first:
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Mac/Linux: source .venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

If an existing virtual environment points to a Python installation that no longer exists, recreate it before installing dependencies:

```bash
# Windows PowerShell
if (Test-Path .\.venv) { Remove-Item -Recurse -Force .\.venv }
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd alm-project/frontend
npm ci
npm start
```

## Supported Audio Formats

| Format | Extension | Notes |
| --- | --- | --- |
| WAV | `.wav` | Best for clean demo-quality recordings |
| MP3 | `.mp3` | Supported through `audioread`, no ffmpeg required |
| OGG | `.ogg` | Good for browser-exported audio |
| FLAC | `.flac` | Lossless archival audio |
| WebM | `.webm` | Works with browser microphone recordings |

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | Welcome message and API info |
| GET | `/api/health` | Health status, uptime, Gemini config state |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in and receive a bearer token |
| GET | `/api/auth/me` | Return the signed-in account |
| POST | `/api/analyze` | Authenticated audio analysis; saves the report to that account |
| GET | `/api/history` | Authenticated, account-private paginated history |
| GET | `/api/history/{session_id}` | Read an owned report |
| DELETE | `/api/history/{session_id}` | Delete an owned report |

Protected endpoints require `Authorization: Bearer <access_token>`. Passwords must
be at least 12 characters. Access tokens expire after 12 hours.

## Deploy to Vercel and Render

The frontend is a Create React App site; the backend is a FastAPI service. Deploy
the frontend to Vercel and the API plus PostgreSQL database to Render.

### 1. Prepare GitHub

1. Make sure `.gitignore` is present at the project root. It excludes local
   environment files, Python virtual environments, the local SQLite database,
   uploads, and frontend build/dependency folders.
2. Never upload `.env`, `backend/.env`, API keys, passwords, or database secrets.
   In particular, do not paste `GEMINI_API_KEY` into React/Vercel variables.
3. Create a GitHub repository and push the project. If starting from this folder
   in PowerShell:

   ```powershell
   git init
   git add .
   git status
   # Confirm no .env, database, venv, or node_modules files are staged.
   git commit -m "Prepare ALM for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
   git push -u origin main
   ```

### 2. Create the production database on Render

1. Sign in to Render and create a **PostgreSQL** database. Choose a production
   plan/region appropriate for the expected traffic; free database plans can
   have expiration or resource limits, so check the current terms before relying
   on one for user data.
2. Keep the database in the same region as the web service. Copy its **Internal
   Database URL** from the Render dashboard; do not publish or commit it.
3. Create a Render **Web Service** from the GitHub repository:
   - Root Directory: `backend`
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/api/health`
4. Add these environment variables to the web service:

   | Key | Value |
   | --- | --- |
   | `APP_ENV` | `production` |
   | `GEMINI_API_KEY` | Your Google AI Studio key (secret) |
   | `JWT_SECRET` | A randomly generated secret with at least 32 characters |
   | `DATABASE_URL` | Render PostgreSQL **Internal Database URL** |
   | `FRONTEND_ORIGINS` | `http://localhost:3000` initially; update after Vercel deploy |
   | `MAX_FILE_SIZE_MB` | `25` |
   | `MAX_AUDIO_DURATION_SEC` | `120` |
   | `TEMP_DIR` | `/tmp/alm_uploads` |

   Generate a JWT secret locally with PowerShell (keep the output private):

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

5. Deploy the service and inspect the Render logs until startup succeeds. Open
   `https://YOUR-RENDER-SERVICE.onrender.com/api/health`; it should report
   `"status":"ok"` and `"database":"connected"`.

The backend converts Render's standard PostgreSQL URL to the async PostgreSQL
driver, creates the schema on first startup, and safely adds the ownership/report
columns when it encounters the older SQLite-era analysis table. Old rows without
an account owner are intentionally not visible to any new account.

### 3. Deploy the frontend to Vercel

1. In Vercel, import the same GitHub repository as a new project.
2. Set **Root Directory** to `frontend`.
3. Confirm these build settings:
   - Framework Preset: `Create React App`
   - Install Command: `npm ci`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Add the environment variable `REACT_APP_API_URL` with the full Render API
   origin, for example `https://YOUR-RENDER-SERVICE.onrender.com` (no trailing
   slash). This is a public API URL, not a secret.
5. Deploy. The included `frontend/vercel.json` sends app routes to the React
   entry point so reloading `/history` works.

### 4. Allow the Vercel website in backend CORS

1. Copy the exact Vercel production origin, for example
   `https://YOUR-PROJECT.vercel.app`.
2. In Render's backend environment variables, set `FRONTEND_ORIGINS` to that
   exact origin. If using a custom domain, list both origins separated by a
   comma, with no trailing slashes:
   `https://YOUR-PROJECT.vercel.app,https://www.example.com`.
3. Save the environment variable and wait for Render to redeploy. Add any Vercel
   preview origin only if you intend to use previews; avoid wildcard origins.

### 5. Verify the live application

1. Open the Vercel site in a private/incognito browser window and register a
   test account with a unique email and a strong password of at least 12
   characters.
2. Sign out and sign back in to verify credentials and token restoration.
3. Analyze a short test clip; confirm the report appears in History after
   refreshing and signing in again.
4. Create a second test account. Its History should be empty; it must not be able
   to read or delete the first account's report.
5. Check browser Developer Tools → Network. Requests must go to the Render URL,
   succeed without CORS errors, and never request `localhost`.
6. Confirm the Render health endpoint and review Render logs after a test run.
   Test microphone access over HTTPS (the Vercel site uses HTTPS).
7. Remove test accounts/reports if appropriate. Only then share the public URL.

### Production readiness notes

- For smoother response times, use an always-on Render web-service plan. A
  sleeping free service can make a first request slow, while audio analysis may
  take longer than a normal API call.
- Render's `/tmp` is temporary; the app uses it only for in-progress uploads.
  PostgreSQL stores account records and saved reports persistently.
- Set up billing/quota alerts for Gemini and monitor Render database/storage and
  request limits. A valid API key alone does not guarantee unlimited concurrent
  analysis.
- Keep secrets in provider environment settings, restrict database access, and
  rotate `JWT_SECRET` only when you are ready to sign all users out.
- This app stores analysis reports and transcripts in PostgreSQL. Tell users what
  audio/data is retained and how to request deletion before accepting sensitive
  recordings.

## Features

- Live microphone recording with browser `MediaRecorder`
- Drag-and-drop audio upload with client-side validation
- Waveform visualization using WaveSurfer.js
- Audio preprocessing with resampling, denoising, silence detection, and SNR estimation
- Gemini-powered transcript, language, soundscape, emotion, anomaly, and reasoning analysis
- Account sign-in and private, PostgreSQL-backed analysis history
- Premium dark audio-lab UI with animated loading pipeline and result dashboards
- Graceful handling for empty, corrupt, silent, oversized, and unsupported files

## Accuracy Expectations

This project is designed for strong academic demos and engineering presentations, but accuracy depends heavily on microphone quality, background noise, speaker clarity, and the Gemini model response quality. Clear close-mic recordings usually produce the best transcript and emotion results, while heavily distorted, overlapping, or extremely noisy scenes can reduce confidence. For professor demos, use short real-world clips with clearly audible speech and environmental cues.
