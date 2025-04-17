from typing import Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user
from app.services.payment_gateway import PaymentGateway

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)

@router.post("", response_model=dict)
def create_payment(
    booking_id: int,
    payment_method: str,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Tạo giao dịch thanh toán.
    """
    # Kiểm tra đơn đặt vé
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin đặt vé"
        )
    
    if booking.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn đặt vé không ở trạng thái chờ thanh toán"
        )
    
    # Kiểm tra xem đã có giao dịch thanh toán chưa
    existing_payment = db.query(models.Payment).filter(
        models.Payment.booking_id == booking_id
    ).first()
    
    if existing_payment and existing_payment.status != "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn đặt vé này đã có giao dịch thanh toán"
        )
    
    # Tạo đối tượng thanh toán
    payment_gateway = PaymentGateway()
    
    # URL để redirect sau khi thanh toán
    base_url = str(request.base_url)
    callback_url = f"{base_url}api/v1/payments/confirm?booking_id={booking_id}"
    
    # Tạo giao dịch thanh toán
    payment_data = payment_gateway.create_payment(
        amount=booking.total_price,
        description=f"Thanh toán vé xe #{booking.booking_code}",
        redirect_url=callback_url
    )
    
    # Nếu tạo giao dịch thành công
    if "payment_url" in payment_data:
        # Lưu thông tin thanh toán
        payment = models.Payment(
            booking_id=booking_id,
            amount=booking.total_price,
            payment_method=payment_method,
            status="pending"
        )
        
        db.add(payment)
        db.commit()
        
        return {
            "payment_url": payment_data["payment_url"],
            "transaction_id": payment_data.get("transaction_id")
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tạo giao dịch thanh toán"
        )

@router.post("/confirm")
def confirm_payment(
    transaction_id: str,
    booking_id: int,
    status: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Xác nhận thanh toán từ cổng thanh toán.
    """
    # Kiểm tra đơn đặt vé
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin đặt vé"
        )
    
    # Kiểm tra giao dịch thanh toán
    payment = db.query(models.Payment).filter(models.Payment.booking_id == booking_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin thanh toán"
        )
    
    # Kiểm tra trạng thái thanh toán từ cổng thanh toán
    payment_gateway = PaymentGateway()
    payment_info = payment_gateway.verify_payment(transaction_id)
    
    if payment_info.get("status") == "success":
        # Cập nhật trạng thái thanh toán
        payment.status = "completed"
        payment.transaction_id = transaction_id
        payment.payment_date = datetime.now()
        
        # Cập nhật trạng thái đặt vé
        booking.status = "confirmed"
        
        db.commit()
        
        return {"message": "Thanh toán thành công"}
    else:
        # Cập nhật trạng thái thanh toán
        payment.status = "failed"
        payment.transaction_id = transaction_id
        
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thanh toán thất bại"
        )

@router.post("/refund")
def refund_payment(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Hoàn tiền khi hủy vé hợp lệ.
    """
    # Kiểm tra đơn đặt vé
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin đặt vé"
        )
    
    # Kiểm tra trạng thái đặt vé
    if booking.status != "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn đặt vé chưa bị hủy"
        )
    
    # Kiểm tra giao dịch thanh toán
    payment = db.query(models.Payment).filter(
        models.Payment.booking_id == booking_id,
        models.Payment.status == "completed"
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không tìm thấy thông tin thanh toán hoặc thanh toán chưa hoàn tất"
        )
    
    # Kiểm tra xem đã hoàn tiền chưa
    if payment.refund_amount is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn đặt vé này đã được hoàn tiền"
        )
    
    # Tính số tiền hoàn lại
    # Giả sử nếu hủy trước 24h thì hoàn 100%, trước 12h thì hoàn 50%, còn lại thì không hoàn
    bus = db.query(models.Bus).filter(models.Bus.id == booking.bus_id).first()
    current_datetime = datetime.now()
    
    # Tổng hợp ngày và giờ khởi hành
    departure_datetime = datetime.combine(bus.departure_date, bus.departure_time)
    time_diff = departure_datetime - current_datetime
    
    refund_amount = 0
    if time_diff.total_seconds() > 24 * 3600:  # Hơn 24h
        refund_amount = payment.amount
    elif time_diff.total_seconds() > 12 * 3600:  # Hơn 12h
        refund_amount = payment.amount * 0.5
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đã quá thời hạn hoàn tiền"
        )
    
    # Xử lý hoàn tiền
    payment_gateway = PaymentGateway()
    refund_data = payment_gateway.process_refund(
        transaction_id=payment.transaction_id,
        amount=refund_amount
    )
    
    if refund_data.get("status") == "success":
        # Cập nhật thông tin hoàn tiền
        payment.refund_amount = refund_amount
        payment.refund_date = datetime.now()
        payment.refund_transaction_id = refund_data.get("refund_id")
        payment.status = "refunded"
        
        db.commit()
        
        return {"message": "Hoàn tiền thành công", "refund_amount": refund_amount}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hoàn tiền thất bại"
        )