import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function BusDetail() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [bus, setBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusDetails();
    fetchBusSeats();
  }, [busId]);

  const fetchBusDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/buses/${busId}`);
      setBus(response.data);
    } catch (err) {
      console.error('Error fetching bus details:', err);
      setError('Không thể tải thông tin xe. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusSeats = async () => {
    try {
      setLoadingSeats(true);
      const response = await axios.get(`/api/v1/buses/${busId}/seats`);
      setSeats(response.data);
    } catch (err) {
      console.error('Error fetching bus seats:', err);
      setError('Không thể tải thông tin ghế. Vui lòng thử lại sau.');
    } finally {
      setLoadingSeats(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Format "HH:MM" from "HH:MM:SS"
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const handleSeatClick = (seat) => {
    if (seat.is_booked === false) { // Sửa từ is_available thành is_booked === false
      if (selectedSeats.includes(seat.id)) {
        setSelectedSeats(selectedSeats.filter(id => id !== seat.id));
      } else {
        setSelectedSeats([...selectedSeats, seat.id]);
      }
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ghế');
      return;
    }
    
    // Redirect to booking confirmation page with selected seats
    navigate(`/booking?bus_id=${busId}&seats=${selectedSeats.join(',')}`);
  };

  if (loading) {
    return <div className="loading">Đang tải thông tin chi tiết...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Tính số ghế trống từ danh sách ghế
  const availableSeats = Array.isArray(seats) ? seats.filter(seat => !seat.is_booked).length : 0;

  return (
    <div className="bus-detail-container">
      <div className="back-button">
        <button onClick={() => navigate(-1)}>
          &larr; Quay lại
        </button>
      </div>

      {bus && (
        <div className="bus-detail-card">
          <div className="bus-detail-header">
            <h2>{bus.bus_type || 'Xe khách'}</h2>
            <p className="bus-route">{bus.route?.from_location || 'Điểm đi'} - {bus.route?.to_location || 'Điểm đến'}</p>
          </div>

          <div className="bus-detail-info">
            <div className="info-group">
              <div className="info-item">
                <span className="label">Ngày khởi hành:</span>
                <span>{formatDate(bus.departure_date)}</span>
              </div>
              <div className="info-item">
                <span className="label">Thời gian khởi hành:</span>
                <span>{formatTime(bus.departure_time)}</span>
              </div>
              {/* Loại bỏ thời gian đến vì không có trong schema */}
            </div>

            <div className="info-group">
              <div className="info-item">
                <span className="label">Tên xe:</span>
                <span>{bus.name || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-item">
                <span className="label">Biển số:</span>
                <span>{bus.license_plate || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-item">
                <span className="label">Loại xe:</span>
                <span>{bus.bus_type || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="info-group">
              <div className="info-item">
                <span className="label">Giá vé:</span>
                <span className="price">{formatPrice(bus.price)}</span>
              </div>
              <div className="info-item">
                <span className="label">Ghế trống:</span>
                <span>{availableSeats}/{bus.capacity || 45}</span>
              </div>
            </div>

            <div className="amenities">
              <h3>Tiện ích</h3>
              <div className="amenities-list">
                {(Array.isArray(bus.amenities) ? bus.amenities : ["Wifi", "Nước", "Điều hòa", "Chăn gối"]).map((amenity, index) => (
                  <div className="amenity" key={index}>
                    <span className="amenity-icon">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="seat-selection">
            <h3>Chọn ghế</h3>
            {loadingSeats ? (
              <div className="loading">Đang tải thông tin ghế...</div>
            ) : (
              <>
                <div className="seat-map">
                  <div className="bus-layout">
                    <div className="driver-area">
                      <div className="steering-wheel">
                        <span>Tài xế</span>
                      </div>
                    </div>
                    <div className="seats-area">
                      {Array.isArray(seats) && seats.length > 0 ? (
                        <div className="seat-grid">
                          {seats.map((seat) => (
                            <div
                              key={seat.id}
                              className={`seat ${!seat.is_booked ? 'available' : 'unavailable'} ${selectedSeats.includes(seat.id) ? 'selected' : ''}`}
                              onClick={() => handleSeatClick(seat)}
                            >
                              {seat.seat_number}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Không có thông tin ghế</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="seat-legend">
                  <div className="legend-item">
                    <div className="legend-sample available"></div>
                    <span>Ghế trống</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-sample selected"></div>
                    <span>Ghế đã chọn</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-sample unavailable"></div>
                    <span>Ghế đã đặt</span>
                  </div>
                </div>

                <div className="selected-seats-summary">
                  <div className="selected-info">
                    <p>Ghế đã chọn: {selectedSeats.map(id => {
                      const seat = seats.find(s => s.id === id);
                      return seat ? seat.seat_number : '';
                    }).join(', ')}</p>
                    <p>Số lượng: {selectedSeats.length}</p>
                    <p>Tổng tiền: {formatPrice(selectedSeats.length * (bus.price || 0))}</p>
                  </div>
                  <button className="btn-continue" onClick={handleContinue} disabled={selectedSeats.length === 0}>
                    Tiếp tục
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BusDetail;