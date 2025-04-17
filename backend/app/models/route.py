from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    distance = Column(Float, nullable=False)
    estimated_duration = Column(Integer, nullable=False)  # Thời gian dự kiến (phút)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())