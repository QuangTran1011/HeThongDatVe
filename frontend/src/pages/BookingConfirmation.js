import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './BookingConfirmation.css';

function BookingConfirmation() {
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [bus, setBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {

        const token = localStorage.getItem('token'); //  nơi lưu token

        const bookingResponse = await api.get(
          `/bookings/code/${bookingCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const bookingData = bookingResponse.data;
        setBooking(bookingData);
        
        // Fetch bus details
        const busResponse = await api.get(`/buses/${bookingData.bus_id}`);
        setBus(busResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.log(err);
        setError('Có lỗi xảy ra khi tải thông tin đặt vé. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    if (bookingCode) {
      fetchBookingDetails();
    }
  }, [bookingCode]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };
  
  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Assuming timeString is in format HH:MM:SS
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
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleViewMyBookings = () => {
    navigate('/my-bookings');
  };
  
  const handleBookAnother = () => {
    navigate('/buses');
  };

  if (loading) {
    return <div className="loading">Đang tải thông tin đặt vé...</div>;
  }
  
  if (error) {
    return (
      <div className="booking-error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/my-bookings')} className="btn-back">
          Xem đơn đặt vé của tôi
        </button>
      </div>
    );
  }

  return (
    <div className="booking-confirmation-container">
      <div className="confirmation-header">
        <div className="confirmation-icon">
          <i className="checkmark">✓</i>
        </div>
        <h1>Đặt vé thành công!</h1>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</p>
      </div>
      
      {booking && (
        <div className="booking-ticket">
          <div className="booking-ticket-header">
            <div className="booking-code">
              <span className="label">Mã đặt vé:</span>
              <span className="value">{booking.booking_code}</span>
            </div>
            <div className={`booking-status ${getStatusClass(booking.status)}`}>
              {getStatusText(booking.status)}
            </div>
          </div>
          
          <div className="ticket-content">
            <div className="ticket-section">
              <h3>Thông tin chuyến xe</h3>
              {bus && (
                <>
                  <div className="bus-route">
                    <span className="from">{bus.route?.from_location || 'Điểm đi'}</span>
                    <span className="arrow">→</span>
                    <span className="to">{bus.route?.to_location || 'Điểm đến'}</span>
                  </div>
                  
                  <div className="ticket-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="label">Ngày khởi hành:</span>
                        <span className="value">{formatDate(bus.departure_date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Giờ khởi hành:</span>
                        <span className="value">{formatTime(bus.departure_time)}</span>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="label">Loại xe:</span>
                        <span className="value">{bus.bus_type || 'Xe khách'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Biển số:</span>
                        <span className="value">{bus.license_plate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="ticket-section">
              <h3>Thông tin hành khách</h3>
              <div className="ticket-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="label">Họ tên:</span>
                    <span className="value">{booking.passenger_name}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{booking.passenger_phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{booking.passenger_email}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ticket-section">
              <h3>Thông tin vé</h3>
              <div className="ticket-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="label">Ngày đặt vé:</span>
                    <span className="value">{formatBookingDate(booking.booking_date)}</span>
                  </div>
                </div>
                
                <div className="detail-row seats-row">
                  <div className="detail-item full-width">
                    <span className="label">Ghế đã đặt:</span>
                    <div className="seats-list">
                    {booking.booked_seats && booking.booked_seats.map(bookedSeat => (
                      <span key={bookedSeat.id} className="seat-chip">
                        Ghế {bookedSeat.seat.seat_number}
                      </span>
                    ))}
                    </div>
                  </div>
                </div>
                
                <div className="detail-row pricing-row">
                  <div className="detail-item">
                    <span className="label">Giá vé:</span>
                    <span className="value">{formatPrice(bus?.price || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Số lượng:</span>
                    <span className="value">{booking.booked_seats ? booking.booked_seats.length : 0} ghế</span>
                  </div>
                  <div className="detail-item total-price">
                    <span className="label">Tổng tiền:</span>
                    <span className="value">{formatPrice(booking.total_price)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ticket-footer">
            <div className="ticket-notes">
              <p><strong>Lưu ý:</strong></p>
              <ul>
                <li>Vui lòng có mặt tại bến xe trước giờ khởi hành ít nhất 30 phút</li>
                <li>Mang theo CCCD/CMND khi lên xe</li>
                <li>Xuất trình mã đặt vé hoặc email xác nhận khi lên xe</li>
              </ul>
            </div>
            <div className="ticket-qr">
              {/* Placeholder for QR code */}
              <div className="qr-placeholder">
                {booking.booking_code}
              </div>
              <p>Quét mã để xác nhận lên xe</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="confirmation-actions">
        <button className="btn-print" onClick={handlePrint}>
          In vé
        </button>
        <button className="btn-my-bookings" onClick={handleViewMyBookings}>
          Xem đơn đặt vé của tôi
        </button>
        <button className="btn-book-another" onClick={handleBookAnother}>
          Đặt vé chuyến khác
        </button>
      </div>
    </div>
  );
}

export default BookingConfirmation;