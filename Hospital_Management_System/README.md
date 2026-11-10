# Hospital Management System — FastAPI + MySQL

Backend-only project with Patient CRUD, Doctor CRUD, manual Patient-to-Doctor assignment, and release workflow.

## Features
- Patient CRUD: create, list, retrieve, full update (PUT), partial update (PATCH), delete
- Doctor CRUD: create, list, retrieve, full update (PUT), partial update (PATCH), delete
- Manual assignment only: no automatic assignment when a doctor is released
- Assignment endpoints: assign, release, list active assignments, list waiting patients
- MySQL via SQLAlchemy and PyMySQL
- Swagger UI at `/docs`

## 1. Create the database
Log in to MySQL:
```sql
CREATE DATABASE IF NOT EXISTS hospital_db;
```

## 2. Configure environment
Copy `.env.example` to `.env`, then set your actual MySQL password in `.env`.
Set `FRONTEND_ORIGINS` to a comma-separated list of trusted frontend origins when the frontend is hosted separately. The default allows the local Vite development and preview origins.
Do not commit `.env` or share your password.

## 3. Create virtual environment and install packages (Windows PowerShell)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## 4. Start the server
Run from the folder containing `app`:
```powershell
python -m uvicorn app.main:app --reload --reload-dir app
```
Open `http://127.0.0.1:8000/docs`.

The application creates tables defined by the models when it starts. `create_all()` does not migrate existing tables when model columns change. Use a migration tool such as Alembic for later schema changes.

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
