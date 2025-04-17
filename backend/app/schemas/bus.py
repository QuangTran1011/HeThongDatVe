from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date, time
from app.schemas.route import Route

class SeatBase(BaseModel):
    seat_number: str
    is_booked: bool = False

class SeatCreate(SeatBase):
    bus_id: int

class Seat(SeatBase):
    id: int
    bus_id: int
    
    class Config:
        orm_mode = True

class BusBase(BaseModel):
    name: str
    license_plate: str
    capacity: int
    bus_type: str
    route_id: int
    departure_date: date
    departure_time: time
    price: float
    status: str = "active"

class BusCreate(BusBase):
    pass

class BusUpdate(BaseModel):
    name: Optional[str] = None
    license_plate: Optional[str] = None
    capacity: Optional[int] = None
    bus_type: Optional[str] = None
    route_id: Optional[int] = None
    departure_date: Optional[date] = None
    departure_time: Optional[time] = None
    price: Optional[float] = None
    status: Optional[str] = None

class BusInDBBase(BusBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Bus(BusInDBBase):
    route: Optional["Route"] = None

class BusWithSeats(Bus):
    seats: List[Seat] = []