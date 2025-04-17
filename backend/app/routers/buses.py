from typing import Any, List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/buses",
    tags=["buses"],
)

@router.get("", response_model=List[schemas.Bus])
def get_buses(
    route_id: Optional[int] = Query(None),
    date: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy danh sách xe theo tuyến đường và ngày.
    """
    query = db.query(models.Bus)
    
    if route_id:
        query = query.filter(models.Bus.route_id == route_id)
    
    if date:
        query = query.filter(models.Bus.departure_date == date)
    
    buses = query.offset(skip).limit(limit).all()
    return buses

@router.get("/{bus_id}", response_model=schemas.Bus)
def get_bus(
    bus_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy thông tin chi tiết về một xe.
    """
    bus = db.query(models.Bus).filter(models.Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin xe"
        )
    return bus

@router.get("/{bus_id}/seats", response_model=List[schemas.Seat])
def get_bus_seats(
    bus_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy danh sách ghế còn trống của một xe.
    """
    # Kiểm tra xe tồn tại
    bus = db.query(models.Bus).filter(models.Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin xe"
        )
    
    # Lấy danh sách tất cả các ghế của xe
    seats = db.query(models.Seat).filter(models.Seat.bus_id == bus_id).all()
    return seats