import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MyBookings.css';

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busDetails, setBusDetails] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const token = localStorage.getItem('token'); //  nơi lưu token

        const response = await api.get('/bookings/my',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBookings(response.data);
        
        // Fetch bus details for each booking
        const busIds = [...new Set(response.data.map(booking => booking.bus_id))];
        const busDetailsMap = {};
        
        await Promise.all(
          busIds.map(async (busId) => {
            try {
              const busResponse = await api.get(`/buses/${busId}`);
              busDetailsMap[busId] = busResponse.data;
            } catch (err) {
              console.error(`Error fetching bus details for ID ${busId}:`, err);
              busDetailsMap[busId] = null;
            }
          })
        );
        
        setBusDetails(busDetailsMap);
        setLoading(false);
      } catch (err) {
        setError('Có lỗi xảy ra khi tải danh sách đặt vé. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchMyBookings();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };
  
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };
  
  const formatBookingDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN')}`;
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Đang xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };
  
  const handleViewBooking = (bookingCode) => {
    navigate(`/booking/confirmation/${bookingCode}`);
  };
  
  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy đặt vé này không?');
    
    if (confirmCancel) {
      try {
        await api.delete(`/bookings/${bookingId}`);
        // Update the booking status in the local state
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' } 
            : booking
        ));
      } catch (err) {
        alert(err.response?.data?.detail || 'Có lỗi xảy ra khi hủy đặt vé. Vui lòng thử lại sau.');
      }
    }
  };
  
  const handleBookNewTicket = () => {
    navigate('/buses');
  };
  
  const sortBookingsByDate = (a, b) => {
    // Sort by booking date (newest first)
    return new Date(b.booking_date) - new Date(a.booking_date);
  };

  const filterBookings = (booking) => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  if (loading) {
    return <div className="loading">Đang tải danh sách đặt vé...</div>;
  }
  
  if (error) {
    return (
      <div className="bookings-error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="btn-back">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <div className="my-bookings-header">
        <h2>Đơn đặt vé của tôi</h2>
        <button onClick={handleBookNewTicket} className="btn-book-new">
          Đặt vé mới
        </button>
      </div>
      
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>Bạn chưa có đơn đặt vé nào.</p>
          <button onClick={handleBookNewTicket} className="btn-book-new">
            Đặt vé ngay
          </button>
        </div>
      ) : (
        <>
          <div className="bookings-filter">
            <label htmlFor="status-filter">Lọc theo trạng thái:</label>
            <select 
              id="status-filter" 
              value={filterStatus} 
              onChange={handleFilterChange}
              className="status-filter-select"
            >
              <option value="all">Tất cả</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="pending">Đang xử lý</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          
          <div className="bookings-list">
            {bookings
              .sort(sortBookingsByDate)
              .filter(filterBookings)
              .map(booking => {
                const bus = busDetails[booking.bus_id];
                return (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-card-header">
                      <div className="booking-code">
                        <span className="label">Mã đặt vé:</span>
                        <span className="value">{booking.booking_code}</span>
                      </div>
                      <div className={`booking-status ${getStatusClass(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </div>
                    </div>
                    
                    <div className="booking-card-content">
                      {bus && (
                        <div className="booking-route">
                          <div className="route-info">
                            <span className="from">{bus.route?.from_location || 'Điểm đi'}</span>
                            <span className="arrow">→</span>
                            <span className="to">{bus.route?.to_location || 'Điểm đến'}</span>
                          </div>
                          <div className="date-time">
                            <span className="date">{formatDate(bus.departure_date)}</span>
                            <span className="time">{formatTime(bus.departure_time)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="booking-details">
                        <div className="detail-item">
                          <span className="label">Hành khách:</span>
                          <span className="value">{booking.passenger_name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Ngày đặt:</span>
                          <span className="value">{formatBookingDate(booking.booking_date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Số lượng ghế:</span>
                          <span className="value">{booking.booked_seats ? booking.booked_seats.length : 0}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Tổng tiền:</span>
                          <span className="value price">{formatPrice(booking.total_price)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="booking-card-actions">
                      <button 
                        className="btn-view" 
                        onClick={() => handleViewBooking(booking.booking_code)}
                      >
                        Xem chi tiết
                      </button>
                      
                      {booking.status !== 'cancelled' && (
                        <button 
                          className="btn-cancel" 
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={booking.status === 'cancelled'}
                        >
                          Hủy đặt vé
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          
          {bookings.filter(filterBookings).length === 0 && (
            <div className="no-filtered-bookings">
              <p>Không có đơn đặt vé nào với trạng thái đã chọn.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyBookings;