from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Time, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    license_plate = Column(String(20), nullable=False, unique=True)
    capacity = Column(Integer, nullable=False)
    bus_type = Column(String(50), nullable=False)  # Loại xe: Standard, Luxury, VIP
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    departure_date = Column(Date, nullable=False)
    departure_time = Column(Time, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String(20), default="active")  # active, cancelled, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    route = relationship("Route", backref="buses")
    seats = relationship("Seat", back_populates="bus", cascade="all, delete-orphan")

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)
    seat_number = Column(String(10), nullable=False)
    is_booked = Column(Integer, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    bus = relationship("Bus", back_populates="seats")