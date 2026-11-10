import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app import models  # noqa: F401 - imports models so create_all can register them
from app.routers import patient, doctor, assignment

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
