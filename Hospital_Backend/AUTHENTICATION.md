# Authentication rollout

## Database migration

Back up Supabase, then run `schema.sql` in the Supabase SQL Editor. The existing patient, doctor, and assignment tables and rows are not dropped or rewritten. The script adds `users`, `patient_profiles`, and `doctor_profiles` using `CREATE TABLE IF NOT EXISTS`. Existing clinical rows remain unchanged and are not automatically linked to newly registered accounts. The migration is not run automatically during startup.

## Environment and administrator bootstrap

Configure these values in Render:

- `DATABASE_URL`: the Supabase PostgreSQL connection URI.
- `JWT_SECRET_KEY`: a random secret with at least 32 characters. Generate one with Python's `secrets.token_urlsafe(48)`. Do not put this value in Vite/Vercel.

Public registration only creates patient and doctor accounts. After the database migration and environment setup, temporarily provide `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` to the backend process and run:

```powershell
python -m app.bootstrap_admin
```

The password must be 16–128 characters. The command refuses to run once any `ADMIN` exists and never prints the password. Remove the bootstrap variables immediately after success. No public admin registration endpoint exists.

## Roles and routes

Send the login `access_token` as `Authorization: Bearer <token>`.

- `POST /auth/register/patient`: patient account becomes active immediately.
- `POST /auth/register/doctor`: doctor account remains pending until approved.
- `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
- `POST /auth/change-password`: verifies the current password and invalidates prior tokens.
- `PATCH /auth/me/patient-profile`: updates only the signed-in patient's profile.
- `PATCH /auth/me/doctor-profile`: updates only the signed-in doctor's contact and experience.
- `GET /auth/me/assignments`: returns only the current patient's or doctor's assignments.
- `GET /auth/me/patients`: returns only patients assigned to the current doctor.
- `GET /auth/admin/doctors`: admin-only doctor account review queue.
- `POST /auth/admin/doctors/{doctor_user_id}/approve`: admin-only approval.
- `POST /auth/admin/doctors/{doctor_user_id}/reject`: admin-only rejection with a reason.

The existing patient, doctor, and assignment CRUD endpoints require `ADMIN`. Doctor routes reject pending/unverified accounts. The assignment workflow also refuses to assign an unapproved doctor. Authorization is enforced on the backend, independently of frontend route guards.

## Current feature boundary

The project currently has manual assignments, but no appointment-booking, prescription, or separate medical-record tables or endpoints. This authentication rollout provides patient-owned profiles and assignments and doctor-owned profiles, assignments, and assigned patient records. It does not create appointment or prescription workflows.

Doctor approvals record the reviewing admin and timestamp. Real clinical deployment additionally requires email verification, audit logging, rate limiting, managed migrations, and stronger clinical-data protections.

## Testing

Install backend development dependencies and run:

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest
```
