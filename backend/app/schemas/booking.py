from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

class BookedSeatBase(BaseModel):
    seat_id: int

class BookedSeatCreate(BookedSeatBase):
    pass

class BookedSeat(BookedSeatBase):
    id: int
    booking_id: int
    
    model_config = {
        "from_attributes": True
    }

class BookingBase(BaseModel):
    bus_id: int
    passenger_name: str
    passenger_phone: str
    passenger_email: EmailStr
    
class BookingCreate(BookingBase):
    seat_ids: List[int]

class BookingUpdate(BaseModel):
    passenger_name: Optional[str] = None
    passenger_phone: Optional[str] = None
    passenger_email: Optional[EmailStr] = None
    status: Optional[str] = None

class BookingInDBBase(BookingBase):
    id: int
    user_id: int
    booking_code: str
    total_price: float
    status: str
    booking_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class Booking(BookingInDBBase):
    booked_seats: List[BookedSeat] = []