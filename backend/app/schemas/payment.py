from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PaymentBase(BaseModel):
    booking_id: int
    amount: float
    payment_method: str

class PaymentCreate(PaymentBase):
    pass

class PaymentConfirm(BaseModel):
    transaction_id: str
    booking_id: int
    status: str

class PaymentRefund(BaseModel):
    booking_id: int
    refund_amount: float
    reason: Optional[str] = None

class PaymentInDBBase(PaymentBase):
    id: int
    transaction_id: Optional[str] = None
    status: str
    payment_date: Optional[datetime] = None
    refund_amount: Optional[float] = None
    refund_date: Optional[datetime] = None
    refund_transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Payment(PaymentInDBBase):
    pass