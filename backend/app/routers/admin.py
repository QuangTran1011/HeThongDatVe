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

@router.patch("/bookings/{booking_id}", response_model=schemas.Booking)
def update_booking(
    booking_id: int,
    booking_update: schemas.BookingUpdate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update booking details (including status).
    """
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update booking fields if provided in the request
    if booking_update.passenger_name is not None:
        booking.passenger_name = booking_update.passenger_name
    
    if booking_update.passenger_phone is not None:
        booking.passenger_phone = booking_update.passenger_phone
    
    if booking_update.passenger_email is not None:
        booking.passenger_email = booking_update.passenger_email
    
    if booking_update.status is not None:
        booking.status = booking_update.status
    
    db.commit()
    db.refresh(booking)
    return booking

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
    
    # Tính tổng số ghế có sẵn
    total_available_seats = db.query(func.sum(models.Bus.capacity)).filter(
        models.Bus.departure_date >= start_date,
        models.Bus.departure_date <= end_date
    )
    
    if route_id:
        total_available_seats = total_available_seats.filter(models.Bus.route_id == route_id)
    
    total_available_seats = total_available_seats.scalar() or 0
    
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
    
    # Tính fill rate - tỉ lệ lấp đầy
    fill_rate = 0
    if total_available_seats > 0:
        fill_rate = total_seats_sold / total_available_seats
    
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
        
        # Tổng số ghế có sẵn trong ngày
        daily_available_seats = db.query(func.sum(models.Bus.capacity)).filter(
            models.Bus.departure_date == current_date
        )
        
        if route_id:
            daily_available_seats = daily_available_seats.filter(models.Bus.route_id == route_id)
        
        daily_available_seats = daily_available_seats.scalar() or 0
        
        # Số ghế đã bán trong ngày
        daily_seats_sold = db.query(func.count(models.BookedSeat.id)).join(
            models.Booking,
            models.BookedSeat.booking_id == models.Booking.id
        ).filter(
            cast(models.Booking.booking_date, Date) == current_date,
            models.Booking.status.in_(["confirmed", "completed"])
        )
        
        if route_id:
            daily_seats_sold = daily_seats_sold.join(
                models.Bus,
                models.Booking.bus_id == models.Bus.id
            ).filter(models.Bus.route_id == route_id)
        
        daily_seats_sold = daily_seats_sold.scalar() or 0
        
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
        
        # Tính fill rate cho ngày
        daily_fill_rate = 0
        if daily_available_seats > 0:
            daily_fill_rate = daily_seats_sold / daily_available_seats
        
        daily_stats.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "buses": daily_buses,
            "bookings": daily_bookings,
            "seats": daily_seats_sold,
            "revenue": daily_revenue,
            "fill_rate": daily_fill_rate
        })
        
        current_date += timedelta(days=1)
    
    # Format daily_stats for the frontend
    daily_sales = {}
    for stat in daily_stats:
        daily_sales[stat["date"]] = {
            "revenue": stat["revenue"],
            "bookings": stat["bookings"],
            "seats": stat["seats"]
        }
    
    # Thống kê theo tuyến đường
    route_stats = []
    routes_performance = {}
    top_routes = []
    
    if not route_id:
        routes = db.query(models.Route).all()
        for route in routes:
            # Số chuyến xe theo tuyến
            route_buses = buses_query.filter(models.Bus.route_id == route.id).count()
            
            # Tổng số ghế có sẵn theo tuyến
            route_available_seats = db.query(func.sum(models.Bus.capacity)).filter(
                models.Bus.route_id == route.id,
                models.Bus.departure_date >= start_date,
                models.Bus.departure_date <= end_date
            ).scalar() or 0
            
            # Số ghế đã bán theo tuyến
            route_seats_sold = db.query(func.count(models.BookedSeat.id)).join(
                models.Booking,
                models.BookedSeat.booking_id == models.Booking.id
            ).join(
                models.Bus,
                models.Booking.bus_id == models.Bus.id
            ).filter(
                models.Bus.route_id == route.id,
                cast(models.Booking.booking_date, Date) >= start_date,
                cast(models.Booking.booking_date, Date) <= end_date,
                models.Booking.status.in_(["confirmed", "completed"])
            ).scalar() or 0
            
            # Số đơn hàng (bookings) theo tuyến
            route_bookings = db.query(models.Booking).join(
                models.Bus,
                models.Booking.bus_id == models.Bus.id
            ).filter(
                models.Bus.route_id == route.id,
                cast(models.Booking.booking_date, Date) >= start_date,
                cast(models.Booking.booking_date, Date) <= end_date,
                models.Booking.status.in_(["confirmed", "completed"])
            ).count()
            
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
            
            # Tính fill rate cho tuyến đường
            route_fill_rate = 0
            if route_available_seats > 0:
                route_fill_rate = route_seats_sold / route_available_seats
            
            route_info = {
                "route_id": route.id,
                "route_name": f"{route.from_location} - {route.to_location}",
                "buses": route_buses,
                "bookings": route_bookings,
                "seats": route_seats_sold,
                "revenue": route_revenue,
                "fill_rate": route_fill_rate
            }
            
            route_stats.append(route_info)
            
            # Thêm vào routes_performance cho biểu đồ
            route_name = f"{route.from_location} - {route.to_location}"
            routes_performance[route_name] = {
                "revenue": route_revenue,
                "bookings": route_bookings,
                "seats": route_seats_sold
            }
            
            # Thêm vào top_routes để sắp xếp sau
            top_routes.append({
                "name": route_name,
                "revenue": route_revenue,
                "bookings": route_bookings,
                "seats": route_seats_sold,
                "fill_rate": route_fill_rate
            })
    
    # Sắp xếp top_routes theo doanh thu (giảm dần)
    top_routes.sort(key=lambda x: x["revenue"], reverse=True)
    # Giới hạn số lượng tuyến hàng đầu
    top_routes = top_routes[:5]
    
    return {
        "total_buses": total_buses,
        "total_seats_sold": total_seats_sold,
        "total_bookings": bookings_query.count(),
        "total_revenue": total_revenue,
        "fill_rate": fill_rate,
        "period": {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        },
        "daily_sales": daily_sales,
        "routes_performance": routes_performance,
        "top_routes": top_routes
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

@router.get("/routes", response_model=List[schemas.Route])
def get_routes(
    skip: int = 0,
    limit: int = 10,
    search: str = None,
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy danh sách tuyến đường với phân trang và tìm kiếm.
    """
    query = db.query(models.Route)
    
    if search:
        query = query.filter(
            models.Route.from_location.ilike(f"%{search}%") |
            models.Route.to_location.ilike(f"%{search}%")
        )
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    routes = query.order_by(models.Route.id).offset(skip).limit(limit).all()
    
    # Set headers for pagination metadata
    # FastAPI allows setting response headers, but we need to add this logic in the middleware
    # or return a custom response object
    
    return routes


@router.put("/routes/{route_id}", response_model=schemas.Route)
def update_route(
    route_id: int,
    route_in: schemas.RouteUpdate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Cập nhật tuyến đường (chỉ admin).
    """
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tuyến đường"
        )
    
    # Update fields if provided
    if route_in.from_location is not None:
        route.from_location = route_in.from_location
    if route_in.to_location is not None:
        route.to_location = route_in.to_location
    if route_in.distance is not None:
        route.distance = route_in.distance
    if route_in.estimated_duration is not None:
        route.estimated_duration = route_in.estimated_duration
    if route_in.description is not None:
        route.description = route_in.description
    
    db.commit()
    db.refresh(route)
    
    return route


@router.delete("/routes/{route_id}", response_model=dict)
def delete_route(
    route_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Xóa tuyến đường (chỉ admin).
    """
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tuyến đường"
        )
    
    # Check if route is being used by any buses
    buses = db.query(models.Bus).filter(models.Bus.route_id == route_id).all()
    if buses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa tuyến đường đang được sử dụng bởi các chuyến xe"
        )
    
    db.delete(route)
    db.commit()
    
    return {"message": "Xóa tuyến đường thành công"}