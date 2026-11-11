from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    experience = Column(Integer, nullable=True)
    status = Column(String(30), nullable=False, default="AVAILABLE")

    assignments = relationship("Assignment", back_populates="doctor")
    profile = relationship(
        "DoctorProfile",
        back_populates="doctor",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def verification_status(self):
        return self.profile.verification_status if self.profile else "UNREGISTERED"
