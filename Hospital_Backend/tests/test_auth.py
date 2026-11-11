import os
from datetime import datetime, timezone
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["AUTO_CREATE_TABLES"] = "false"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-key-that-is-at-least-32-bytes"
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

from app.database import Base, get_db
from app.main import app
from app.models.assignment import Assignment
from app.models.user import DoctorProfile, PatientProfile, User
from app.security import hash_password


@pytest.fixture
def api():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = test_sessions()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client, test_sessions
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def register_patient(client, email="patient@example.com"):
    return client.post("/auth/register/patient", json={
        "email": email,
        "password": "patient-password-123",
        "name": "Pat Example",
        "age": 31,
        "gender": "Other",
        "phone": "555-0101",
        "disease": "Routine check",
    })


def register_doctor(client, email="doctor@example.com"):
    return client.post("/auth/register/doctor", json={
        "email": email,
        "password": "doctor-password-123",
        "name": "Dr. Example",
        "specialization": "Cardiology",
        "phone": "555-0102",
        "experience": 8,
        "license_number": "LIC-12345",
    })


def add_admin(test_sessions):
    with test_sessions() as db:
        admin = User(
            email="admin@example.com",
            password_hash=hash_password("admin-password-123"),
            role="ADMIN",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        return admin.id


def token_for(client, email, password):
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_patient_registration_is_private_and_patient_data_is_scoped(api):
    client, test_sessions = api
    first = register_patient(client)
    second = register_patient(client, "other@example.com")
    assert first.status_code == 201
    assert second.status_code == 201
    assert "password_hash" not in first.text
    assert register_patient(client, "PATIENT@example.com").status_code == 409

    patient_token = token_for(client, "patient@example.com", "patient-password-123")
    patient_headers = {"Authorization": f"Bearer {patient_token}"}
    assert client.get("/patients/", headers=patient_headers).status_code == 403
    current = client.get("/auth/me", headers=patient_headers)
    assert current.status_code == 200
    assert current.json()["role"] == "PATIENT"
    patient_id = current.json()["profile"]["id"]

    add_admin(test_sessions)
    admin_token = token_for(client, "admin@example.com", "admin-password-123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    assert client.get("/patients/", headers=admin_headers).status_code == 200
    assert client.get("/patients/").status_code == 401

    doctor_response = register_doctor(client)
    assert doctor_response.status_code == 201
    doctor_user_id = doctor_response.json()["id"]
    with test_sessions() as db:
        patient_profiles = db.query(PatientProfile).order_by(PatientProfile.patient_id).all()
        doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == UUID(doctor_user_id)).first()
        assert doctor_profile is not None
        own_patient_id = patient_profiles[0].patient_id
        pending_doctor_id = doctor_profile.doctor_id

    assert client.post(
        "/assignments/assign",
        headers=admin_headers,
        json={"patient_id": own_patient_id, "doctor_id": pending_doctor_id},
    ).status_code == 403

    with test_sessions() as db:
        assignment = Assignment(
            patient_id=own_patient_id,
            doctor_id=pending_doctor_id,
            status="ACTIVE",
            assigned_at=datetime.now(timezone.utc),
        )
        db.add(assignment)
        db.commit()

    own_assignments = client.get("/auth/me/assignments", headers=patient_headers)
    assert own_assignments.status_code == 200
    assert [row["patient_id"] for row in own_assignments.json()] == [patient_id]
    changed = client.patch(
        "/auth/me/patient-profile",
        headers=patient_headers,
        json={"phone": "555-9999"},
    )
    assert changed.status_code == 200
    assert changed.json()["phone"] == "555-9999"
    assert client.get("/auth/admin/doctors", headers=patient_headers).status_code == 403


def test_doctor_is_pending_until_admin_approval_and_sees_only_assigned_patients(api):
    client, test_sessions = api
    add_admin(test_sessions)
    admin_token = token_for(client, "admin@example.com", "admin-password-123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    first_patient = register_patient(client, "first-patient@example.com")
    second_patient = register_patient(client, "second-patient@example.com")
    assert first_patient.status_code == second_patient.status_code == 201
    pending = register_doctor(client)
    assert pending.status_code == 201
    assert pending.json()["is_verified"] is False
    assert client.post(
        "/auth/login",
        json={"email": "doctor@example.com", "password": "doctor-password-123"},
    ).status_code == 403

    doctor_user_id = pending.json()["id"]
    assert client.get("/auth/admin/doctors").status_code == 401

    approved = client.post(f"/auth/admin/doctors/{doctor_user_id}/approve", headers=admin_headers)
    assert approved.status_code == 200
    assert approved.json()["verification_status"] == "APPROVED"
    doctor_token = token_for(client, "doctor@example.com", "doctor-password-123")
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
    assert client.get("/doctors/", headers=doctor_headers).status_code == 403
    assert client.get("/auth/me", headers=doctor_headers).json()["role"] == "DOCTOR"
    assert client.get("/auth/admin/doctors", headers=doctor_headers).status_code == 403
    assert client.get("/doctors/available", headers=admin_headers).json()[0]["verification_status"] == "APPROVED"
    assert client.patch(
        "/auth/me/doctor-profile",
        headers=doctor_headers,
        json={"phone": "555-7711"},
    ).status_code == 200
    assert client.patch(
        "/auth/me/patient-profile",
        headers=doctor_headers,
        json={"phone": "555-7712"},
    ).status_code == 403

    with test_sessions() as db:
        patient_ids = [
            profile.patient_id
            for profile in db.query(PatientProfile).order_by(PatientProfile.patient_id).all()
        ]
        doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == UUID(doctor_user_id)).first()
        doctor_id = doctor_profile.doctor_id
        db.add(Assignment(
            patient_id=patient_ids[0],
            doctor_id=doctor_id,
            status="ACTIVE",
            assigned_at=datetime.now(timezone.utc),
        ))
        db.commit()

    assigned = client.get("/auth/me/patients", headers=doctor_headers)
    assert assigned.status_code == 200
    assert [patient["id"] for patient in assigned.json()] == [patient_ids[0]]
    rejected = client.post(
        f"/auth/admin/doctors/{doctor_user_id}/reject",
        headers=admin_headers,
        json={"reason": "Credentials could not be verified"},
    )
    assert rejected.status_code == 200
    assert client.get("/auth/me", headers=doctor_headers).status_code == 401
    assert client.post(
        "/auth/login",
        json={"email": "doctor@example.com", "password": "doctor-password-123"},
    ).status_code == 403


def test_password_change_and_logout_revoke_existing_tokens(api):
    client, _ = api
    assert register_patient(client).status_code == 201
    token = token_for(client, "patient@example.com", "patient-password-123")
    headers = {"Authorization": f"Bearer {token}"}

    changed = client.post(
        "/auth/change-password",
        headers=headers,
        json={
            "current_password": "patient-password-123",
            "new_password": "patient-password-456",
        },
    )
    assert changed.status_code == 204
    assert client.get("/auth/me", headers=headers).status_code == 401
    new_token = token_for(client, "patient@example.com", "patient-password-456")
    assert client.post("/auth/logout", headers={"Authorization": f"Bearer {new_token}"}).status_code == 204
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {new_token}"}).status_code == 401


def test_registration_validates_password_and_required_details(api):
    client, _ = api
    assert client.post("/auth/register/admin", json={}).status_code == 404
    payload = {
        "email": "invalid@example.com",
        "password": "short",
        "name": " ",
        "age": 31,
        "gender": "Other",
        "phone": "555-0101",
    }
    assert client.post("/auth/register/patient", json=payload).status_code == 422


def test_admin_bootstrap_is_one_time_and_uses_environment_credentials(api, monkeypatch):
    _, test_sessions = api
    from app import bootstrap_admin

    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "first-admin@example.com")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "long-bootstrap-password-123")
    monkeypatch.setattr(bootstrap_admin, "SessionLocal", test_sessions)

    assert bootstrap_admin.main() == 0
    with test_sessions() as db:
        admin = db.query(User).filter(User.role == "ADMIN").one()
        assert admin.email == "first-admin@example.com"
        assert admin.is_verified is True
        assert admin.password_hash != "long-bootstrap-password-123"
    with pytest.raises(RuntimeError, match="one-time"):
        bootstrap_admin.main()
