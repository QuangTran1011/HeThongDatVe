from typing import Any, List
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user
from app.services.email import send_booking_confirmation_email

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"],
)

@router.post("", response_model=schemas.Booking)
def create_booking(
    booking_in: schemas.BookingCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Tạo đơn đặt vé mới.
    """
    # Kiểm tra xe tồn tại
    bus = db.query(models.Bus).filter(models.Bus.id == booking_in.bus_id).first()
    if not bus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin xe"
        )
    
    # Kiểm tra các ghế có tồn tại và còn trống không
    seats = []
    for seat_id in booking_in.seat_ids:
        seat = db.query(models.Seat).filter(
            models.Seat.id == seat_id,
            models.Seat.bus_id == bus.id
        ).first()
        
        if not seat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy ghế với ID {seat_id}"
            )
        
        if seat.is_booked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ghế {seat.seat_number} đã được đặt"
            )
        
        seats.append(seat)
    
    # Tính tổng tiền
    total_price = bus.price * len(seats)
    
    # Tạo mã đặt vé
    booking_code = f"BK{datetime.now().strftime('%y%m%d')}{str(uuid.uuid4().int)[:6]}"
    
    # Tạo đơn đặt vé
    booking = models.Booking(
        user_id=current_user.id,
        bus_id=bus.id,
        booking_code=booking_code,
        total_price=total_price,
        passenger_name=booking_in.passenger_name,
        passenger_phone=booking_in.passenger_phone,
        passenger_email=booking_in.passenger_email,
        status="pending"
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Đánh dấu ghế đã được đặt và tạo bản ghi booked_seats
    for seat in seats:
        seat.is_booked = True
        booked_seat = models.BookedSeat(
            booking_id=booking.id,
            seat_id=seat.id
        )
        db.add(booked_seat)
    
    db.commit()
    
    # Gửi email xác nhận đặt vé
    seat_numbers = [seat.seat_number for seat in seats]
    background_tasks.add_task(
        send_booking_confirmation_email,
        email_to=booking.passenger_email,
        booking=booking,
        bus=bus,
        seats=seat_numbers
    )
    
    return booking

@router.get("/{booking_id}", response_model=schemas.Booking)
def get_booking(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy thông tin chi tiết về một đơn đặt vé.
    """
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin đặt vé"
        )
    
    return booking

@router.get("/my", response_model=List[schemas.Booking])
def get_my_bookings(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy danh sách các đơn đặt vé của người dùng hiện tại.
    """
    bookings = db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return bookings

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """
    Hủy đơn đặt vé.
    """
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin đặt vé"
        )
    
    # Kiểm tra xem có thể hủy vé không
    # Giả sử chỉ có thể hủy vé khi trạng thái là pending hoặc confirmed
    # và chưa tới ngày khởi hành
    bus = db.query(models.Bus).filter(models.Bus.id == booking.bus_id).first()
    current_date = datetime.now().date()
    
    if booking.status not in ["pending", "confirmed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể hủy vé với trạng thái hiện tại"
        )
    
    if current_date >= bus.departure_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể hủy vé vì đã tới ngày khởi hành"
        )
    
    # Cập nhật trạng thái đặt vé
    booking.status = "cancelled"
    db.commit()
    
    # Trả lại ghế
    booked_seats = db.query(models.BookedSeat).filter(
        models.BookedSeat.booking_id == booking.id
    ).all()
    
    for booked_seat in booked_seats:
        seat = db.query(models.Seat).filter(models.Seat.id == booked_seat.seat_id).first()
        if seat:
            seat.is_booked = False
    
    db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)