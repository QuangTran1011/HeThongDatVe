from typing import Optional, List
from pydantic import BaseModel, Field
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
    amenities: List[str] = Field(default=["Wifi", "Nước", "Điều hòa"])  # Thêm trường amenities dạng danh sách

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
    amenities: Optional[List[str]] = None  # Thêm trường amenities dạng danh sách

class BusInDBBase(BusBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Bus(BusInDBBase):
    route: Optional["Route"] = None
    
    @property
    def available_seats(self) -> int:
        if hasattr(self, 'seats'):
            return sum(1 for seat in self.seats if not seat.is_booked)
        return 0  # Nếu không có thông tin ghế ngồi

class BusWithSeats(Bus):
    seats: List[Seat] = []
    
    @property
    def available_seats(self) -> int:
        return sum(1 for seat in self.seats if not seat.is_booked)
    
    @property
    def total_seats(self) -> int:
        return self.capacity