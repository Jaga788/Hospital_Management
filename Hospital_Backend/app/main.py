import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, engine
from app import models  # noqa: F401 - registers model tables for SQLAlchemy metadata
from app.routers import patient, doctor, assignment

logger = logging.getLogger(__name__)

if os.getenv("AUTO_CREATE_TABLES", "").lower() == "true":
    Base.metadata.create_all(bind=engine)


default_frontend_origins = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:4173,"
    "http://127.0.0.1:4173"
)
frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", default_frontend_origins).split(",")
    if origin.strip()
]

app = FastAPI(
    title="Hospital Management System API",
    description="Backend API for patients, doctors, and manual treatment assignments.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(assignment.router)


@app.get("/")
def root():
    return {"message": "Hospital Management System API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def readiness():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        logger.exception("Database readiness check failed")
        raise HTTPException(status_code=503, detail="Database unavailable") from error
    return {"status": "ready"}
