# Hospital Management System — FastAPI + PostgreSQL

FastAPI backend with Patient CRUD, Doctor CRUD, manual Patient-to-Doctor assignment, and release workflow. Production uses Supabase PostgreSQL; local MySQL remains supported when `DATABASE_URL` is not set.

## Features
- Patient CRUD: create, list, retrieve, full update (PUT), partial update (PATCH), delete
- Doctor CRUD: create, list, retrieve, full update (PUT), partial update (PATCH), delete
- Manual assignment only: no automatic assignment when a doctor is released
- Assignment endpoints: assign, release, list active assignments, list waiting patients
- PostgreSQL via SQLAlchemy and psycopg; optional local MySQL via PyMySQL
- Swagger UI at `/docs`

## 1. Create the database tables
In the Supabase SQL Editor, run `schema.sql` to create the three application tables if they do not already exist. The script does not drop tables or modify existing rows. It is intentionally not run by the application during startup: a database outage should not prevent Uvicorn from binding to Render's port.

## 2. Configure environment
For local MySQL, copy `.env.example` to `.env` and set your local `DB_PASSWORD`. For a fresh local database only, set `AUTO_CREATE_TABLES=true` to create missing tables at import time; do not enable this in Render. For production, set `DATABASE_URL` in Render to the PostgreSQL URI from Supabase; include `sslmode=require` if it is not already present, and URL-encode special characters in the password. Do not commit `.env` or put database credentials in frontend variables.

Set `FRONTEND_ORIGINS` in Render to a comma-separated list of the exact Vercel production and preview origins that should access the API, without trailing slashes. The default allows localhost only.

## 3. Create virtual environment and install packages (Windows PowerShell)
```powershell
cd Hospital_Backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## 4. Start the server
Run from `Hospital_Backend`:
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Open `http://127.0.0.1:8000/docs`.

`GET /health` is a liveness check that does not require the database. `GET /ready` checks database connectivity and returns HTTP 503 with a logged error if the database is unavailable.

## Render configuration
- Root directory: `Hospital_Backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `DATABASE_URL`, `FRONTEND_ORIGINS`
- Optional health check path: `/ready`

Render provides `PORT`; do not hardcode a production port.

## Vercel configuration
- Root directory: `Hospital_Frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

Set the value to the backend origin only (no `/api` suffix and no trailing slash). Redeploy the frontend after changing environment variables. The Vite development proxy is not available in the Vercel deployment.

## Main endpoints

### Patients
- `POST /patients/`
- `GET /patients/`
- `GET /patients/{patient_id}`
- `PUT /patients/{patient_id}`
- `PATCH /patients/{patient_id}`
- `DELETE /patients/{patient_id}`

### Doctors
- `POST /doctors/`
- `GET /doctors/`
- `GET /doctors/available`
- `GET /doctors/{doctor_id}`
- `PUT /doctors/{doctor_id}`
- `PATCH /doctors/{doctor_id}`
- `DELETE /doctors/{doctor_id}`

### Assignments
- `POST /assignments/assign` with `{"patient_id": 1, "doctor_id": 1}`
- `POST /assignments/{assignment_id}/release`
- `GET /assignments/active`
- `GET /assignments/waiting`

## Workflow
1. Create a patient. Their status defaults to `WAITING`.
2. Create a doctor. Their status defaults to `AVAILABLE`.
3. A receptionist/admin manually calls `POST /assignments/assign`.
4. The patient becomes `UNDER_TREATMENT`, the doctor becomes `BUSY`, and an `ACTIVE` assignment is created.
5. Release using `POST /assignments/{assignment_id}/release`.
6. The assignment becomes `COMPLETED`, patient becomes `COMPLETED`, and doctor becomes `AVAILABLE`.
7. No patient is assigned automatically. The receptionist/admin must manually assign the next patient.

## Notes
- Status fields are intentionally excluded from generic Patient/Doctor update schemas. Use the assignment workflow to change workflow statuses.
- This is a learning/demo backend, not a production-ready clinical system. Add authentication/authorization, audit logging, migrations, and stronger clinical-data protections before real deployment.
