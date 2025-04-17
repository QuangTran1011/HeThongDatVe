from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class RouteBase(BaseModel):
    from_location: str
    to_location: str
    distance: float
    estimated_duration: int  # minutes
    description: Optional[str] = None

class RouteCreate(RouteBase):
    pass

class RouteUpdate(BaseModel):
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    distance: Optional[float] = None
    estimated_duration: Optional[int] = None
    description: Optional[str] = None

class RouteInDBBase(RouteBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Route(RouteInDBBase):
    pass