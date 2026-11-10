# Careflow hospital dashboard

Responsive React dashboard for the FastAPI hospital management backend. It supports patient and doctor CRUD, status/search filters, live overview data, and the backend's manual assignment and release workflow.

## Run locally

1. Start the backend from `Hospital_Backend`:

   ```powershell
   cd Hospital_Backend
   .\venv\Scripts\Activate.ps1
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. In a separate terminal, start the frontend:

   ```powershell
   cd Hospital_Frontend
   npm ci
   npm run dev
   ```

The Vite development server proxies `/api` requests to `http://127.0.0.1:8000`, so the backend must be running. To use a different backend host locally, set `HOSPITAL_API_TARGET` before starting Vite. For Vercel, set `VITE_API_BASE_URL` to the Render backend origin (without an `/api` suffix), and set `FRONTEND_ORIGINS` in Render to the Vercel site's origin.

## Available screens

- **Overview:** patient, waiting, doctor availability, and active assignment counts.
- **Patients:** create, edit, delete, search, and filter patient records.
- **Doctors:** create, edit, delete, search, and filter doctors.
- **Assignments:** manually assign waiting patients to available doctors and release active assignments.

All records are loaded from the backend API; the dashboard does not use mock or seeded data.

## Frontend structure

```text
src/
├── components/   Reusable UI, forms, status indicators, tables, and icons
├── data/         Navigation metadata and shared presentation helpers
├── hooks/        Hospital data loading and API-backed actions
├── layouts/      Dashboard shell, sidebar, and top bar
├── pages/        Overview, patients, doctors, and assignments screens
├── services/     Shared backend API client
├── styles/       Dashboard styles
├── App.jsx       Page composition and shared UI state
└── main.jsx      React entry point
```
