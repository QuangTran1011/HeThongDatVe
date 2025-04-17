from typing import Any, List, Dict
from datetime import datetime, timedelta, date
from sqlalchemy import func, case, cast, Date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

@router.get("/bookings", response_model=List[schemas.Booking])
def get_all_bookings(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    status: str = None,
    start_date: date = None,
    end_date: date = None,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy danh sách tất cả các đơn đặt vé (chỉ admin).
    """
    query = db.query(models.Booking)
    
    # Lọc theo từ khóa tìm kiếm
    if search:
        query = query.filter(
            models.Booking.booking_code.contains(search) |
            models.Booking.passenger_name.contains(search) |
            models.Booking.passenger_email.contains(search) |
            models.Booking.passenger_phone.contains(search)
        )
    
    # Lọc theo trạng thái
    if status:
        query = query.filter(models.Booking.status == status)
    
    # Lọc theo ngày đặt vé
    if start_date:
        query = query.filter(cast(models.Booking.booking_date, Date) >= start_date)
    
    if end_date:
        query = query.filter(cast(models.Booking.booking_date, Date) <= end_date)
    
    bookings = query.order_by(models.Booking.booking_date.desc()).offset(skip).limit(limit).all()
    return bookings

@router.get("/statistics", response_model=Dict)
def get_statistics(
    start_date: date = None,
    end_date: date = None,
    route_id: int = None,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Thống kê chuyến xe, ghế bán được và doanh thu (chỉ admin).
    """
    # Xác định khoảng thời gian (mặc định là 30 ngày gần nhất)
    if not end_date:
        end_date = datetime.now().date()
    
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Base query cho bookings
    bookings_query = db.query(models.Booking).filter(
        cast(models.Booking.booking_date, Date) >= start_date,
        cast(models.Booking.booking_date, Date) <= end_date,
        models.Booking.status.in_(["confirmed", "completed"])
    )
    
    # Base query cho buses
    buses_query = db.query(models.Bus).filter(
        models.Bus.departure_date >= start_date,
        models.Bus.departure_date <= end_date
    )
    
    # Lọc theo tuyến đường nếu có
    if route_id:
        buses_query = buses_query.filter(models.Bus.route_id == route_id)
        bookings_query = bookings_query.join(models.Bus).filter(models.Bus.route_id == route_id)
    
    # Thống kê số chuyến xe
    total_buses = buses_query.count()
    
    # Thống kê số ghế đã bán
    # Đếm tổng số ghế đã đặt qua bảng BookedSeat
    total_seats_sold = db.query(func.count(models.BookedSeat.id)).join(
        models.Booking,
        models.BookedSeat.booking_id == models.Booking.id
    ).filter(
        cast(models.Booking.booking_date, Date) >= start_date,
        cast(models.Booking.booking_date, Date) <= end_date,
        models.Booking.status.in_(["confirmed", "completed"])
    )
    
    if route_id:
        total_seats_sold = total_seats_sold.join(
            models.Bus,
            models.Booking.bus_id == models.Bus.id
        ).filter(models.Bus.route_id == route_id)
    
    total_seats_sold = total_seats_sold.scalar() or 0
    
    # Thống kê doanh thu
    total_revenue = db.query(func.sum(models.Booking.total_price)).filter(
        cast(models.Booking.booking_date, Date) >= start_date,
        cast(models.Booking.booking_date, Date) <= end_date,
        models.Booking.status.in_(["confirmed", "completed"])
    )
    
    if route_id:
        total_revenue = total_revenue.join(
            models.Bus,
            models.Booking.bus_id == models.Bus.id
        ).filter(models.Bus.route_id == route_id)
    
    total_revenue = total_revenue.scalar() or 0
    
    # Thống kê theo ngày
    daily_stats = []
    current_date = start_date
    while current_date <= end_date:
        # Số chuyến xe trong ngày
        daily_buses = buses_query.filter(models.Bus.departure_date == current_date).count()
        
        # Số vé đã bán trong ngày
        daily_bookings = bookings_query.filter(
            cast(models.Booking.booking_date, Date) == current_date
        ).count()
        
        # Doanh thu trong ngày
        daily_revenue = db.query(func.sum(models.Booking.total_price)).filter(
            cast(models.Booking.booking_date, Date) == current_date,
            models.Booking.status.in_(["confirmed", "completed"])
        )
        
        if route_id:
            daily_revenue = daily_revenue.join(
                models.Bus,
                models.Booking.bus_id == models.Bus.id
            ).filter(models.Bus.route_id == route_id)
        
        daily_revenue = daily_revenue.scalar() or 0
        
        daily_stats.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "buses": daily_buses,
            "bookings": daily_bookings,
            "revenue": daily_revenue
        })
        
        current_date += timedelta(days=1)
    
    # Thống kê theo tuyến đường
    route_stats = []
    if not route_id:
        routes = db.query(models.Route).all()
        for route in routes:
            # Số chuyến xe theo tuyến
            route_buses = buses_query.filter(models.Bus.route_id == route.id).count()
            
            # Doanh thu theo tuyến
            route_revenue = db.query(func.sum(models.Booking.total_price)).join(
                models.Bus,
                models.Booking.bus_id == models.Bus.id
            ).filter(
                models.Bus.route_id == route.id,
                cast(models.Booking.booking_date, Date) >= start_date,
                cast(models.Booking.booking_date, Date) <= end_date,
                models.Booking.status.in_(["confirmed", "completed"])
            ).scalar() or 0
            
            route_stats.append({
                "route_id": route.id,
                "route_name": f"{route.from_location} - {route.to_location}",
                "buses": route_buses,
                "revenue": route_revenue
            })
    
    return {
        "total_buses": total_buses,
        "total_seats_sold": total_seats_sold,
        "total_revenue": total_revenue,
        "period": {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        },
        "daily_stats": daily_stats,
        "route_stats": route_stats
    }

@router.post("/buses", response_model=schemas.Bus)
def create_bus(
    bus_in: schemas.BusCreate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Thêm mới xe (chỉ admin).
    """
    # Kiểm tra tuyến đường tồn tại
    route = db.query(models.Route).filter(models.Route.id == bus_in.route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tuyến đường"
        )
    
    # Kiểm tra biển số xe đã tồn tại chưa
    existing_bus = db.query(models.Bus).filter(models.Bus.license_plate == bus_in.license_plate).first()
    if existing_bus:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Biển số xe đã tồn tại"
        )
    
    # Tạo xe mới
    bus = models.Bus(
        name=bus_in.name,
        license_plate=bus_in.license_plate,
        capacity=bus_in.capacity,
        bus_type=bus_in.bus_type,
        route_id=bus_in.route_id,
        departure_date=bus_in.departure_date,
        departure_time=bus_in.departure_time,
        price=bus_in.price,
        status=bus_in.status
    )
    
    db.add(bus)
    db.commit()
    db.refresh(bus)
    
    # Tạo ghế cho xe
    for i in range(1, bus_in.capacity + 1):
        seat = models.Seat(
            bus_id=bus.id,
            seat_number=f"{i}",
            is_booked=False
        )
        db.add(seat)
    
    db.commit()
    
    return bus

@router.put("/buses/{bus_id}", response_model=schemas.Bus)
def update_bus(
    bus_id: int,
    bus_in: schemas.BusUpdate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Cập nhật thông tin xe (chỉ admin).
    """
    # Kiểm tra xe tồn tại
    bus = db.query(models.Bus).filter(models.Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin xe"
        )
    
    # Cập nhật thông tin xe
    if bus_in.name is not None:
        bus.name = bus_in.name
    
    if bus_in.license_plate is not None:
        # Kiểm tra biển số xe đã tồn tại chưa
        existing_bus = db.query(models.Bus).filter(
            models.Bus.license_plate == bus_in.license_plate,
            models.Bus.id != bus_id
        ).first()
        if existing_bus:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Biển số xe đã tồn tại"
            )
        bus.license_plate = bus_in.license_plate
    
    if bus_in.capacity is not None:
        # Nếu thay đổi số ghế, cần kiểm tra và cập nhật danh sách ghế
        if bus_in.capacity != bus.capacity:
            # Đếm số ghế đã đặt
            booked_seats_count = db.query(func.count(models.Seat.id)).filter(
                models.Seat.bus_id == bus.id,
                models.Seat.is_booked == True
            ).scalar() or 0
            
            # Nếu giảm số ghế nhưng số ghế mới nhỏ hơn số ghế đã đặt
            if bus_in.capacity < booked_seats_count:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Không thể giảm số ghế xuống {bus_in.capacity} vì đã có {booked_seats_count} ghế được đặt"
                )
            
            # Nếu tăng số ghế, thêm ghế mới
            if bus_in.capacity > bus.capacity:
                for i in range(bus.capacity + 1, bus_in.capacity + 1):
                    seat = models.Seat(
                        bus_id=bus.id,
                        seat_number=f"{i}",
                        is_booked=False
                    )
                    db.add(seat)
            
            # Nếu giảm số ghế, xóa ghế từ cuối
            if bus_in.capacity < bus.capacity:
                # Lấy danh sách ghế chưa đặt để xóa
                seats_to_delete = db.query(models.Seat).filter(
                    models.Seat.bus_id == bus.id,
                    models.Seat.is_booked == False
                ).order_by(models.Seat.seat_number.desc()).limit(bus.capacity - bus_in.capacity).all()
                
                for seat in seats_to_delete:
                    db.delete(seat)
            
            bus.capacity = bus_in.capacity
    
    if bus_in.bus_type is not None:
        bus.bus_type = bus_in.bus_type
    
    if bus_in.route_id is not None:
        # Kiểm tra tuyến đường tồn tại
        route = db.query(models.Route).filter(models.Route.id == bus_in.route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tuyến đường"
            )
        bus.route_id = bus_in.route_id
    
    if bus_in.departure_date is not None:
        bus.departure_date = bus_in.departure_date
    
    if bus_in.departure_time is not None:
        bus.departure_time = bus_in.departure_time
    
    if bus_in.price is not None:
        bus.price = bus_in.price
    
    if bus_in.status is not None:
        bus.status = bus_in.status
    
    db.commit()
    db.refresh(bus)
    
    return bus

@router.post("/routes", response_model=schemas.Route)
def create_route(
    route_in: schemas.RouteCreate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Thêm tuyến đường mới (chỉ admin).
    """
    # Kiểm tra tuyến đường đã tồn tại chưa
    existing_route = db.query(models.Route).filter(
        models.Route.from_location == route_in.from_location,
        models.Route.to_location == route_in.to_location
    ).first()
    
    if existing_route:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tuyến đường từ {route_in.from_location} đến {route_in.to_location} đã tồn tại"
        )
    
    # Tạo tuyến đường mới
    route = models.Route(
        from_location=route_in.from_location,
        to_location=route_in.to_location,
        distance=route_in.distance,
        estimated_duration=route_in.estimated_duration,
        description=route_in.description
    )
    
    db.add(route)
    db.commit()
    db.refresh(route)
    
    return route