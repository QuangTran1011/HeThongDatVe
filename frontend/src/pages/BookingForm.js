import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './BookingForm.css';

function BookingForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Parse query parameters to get bus_id and selected seats
    const queryParams = new URLSearchParams(location.search);
    const busId = queryParams.get('bus_id');

    // Sửa: dùng useMemo để tránh useEffect chạy vô hạn
    const selectedSeatIds = useMemo(() => {
        return queryParams.get('seats')?.split(',').map(id => parseInt(id)) || [];
    }, [location.search]);

    const [bus, setBus] = useState(null);
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        passenger_name: user?.full_name || '',
        passenger_email: user?.email || '',
        passenger_phone: user?.phone || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchBusAndSeats = async () => {
            try {
                const busResponse = await api.get(`/buses/${busId}`);
                setBus(busResponse.data);

                const seatsResponse = await api.get(`/buses/${busId}/seats`);
                const selectedSeats = seatsResponse.data.filter(seat =>
                    selectedSeatIds.includes(seat.id)
                );
                setSeats(selectedSeats);
                setLoading(false);
            } catch (err) {
                console.log(err);
                setError('Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại sau.');
                setLoading(false);
            }
        };

        if (busId) {
            fetchBusAndSeats();
        } else {
            setError('Không tìm thấy thông tin xe hoặc ghế đã chọn.');
            setLoading(false);
        }
    }, [busId, selectedSeatIds]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const bookingData = {
                bus_id: parseInt(busId),
                seat_ids: selectedSeatIds,
                passenger_name: formData.passenger_name,
                passenger_phone: formData.passenger_phone,
                passenger_email: formData.passenger_email
            };

            const token = localStorage.getItem('token');
            const response = await api.post('/bookings', bookingData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccessMessage('Đặt vé thành công!');
            setTimeout(() => {
                navigate(`/booking/confirmation/${response.data.booking_code}`);
            }, 2000);
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.detail || 'Đã xảy ra lỗi khi đặt vé. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

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

    if (loading) {
        return <div className="loading">Đang tải thông tin...</div>;
    }

    if (error) {
        return (
            <div className="booking-error-container">
                <div className="error-message">{error}</div>
                <button onClick={() => navigate(-1)} className="btn-back">
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="booking-form-container">
            <div className="back-button">
                <button onClick={() => navigate(-1)}>
                    &larr; Quay lại chọn ghế
                </button>
            </div>

            <h2>Đặt vé xe</h2>

            {successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}

            <div className="booking-form-wrapper">
                <div className="booking-summary">
                    <h3>Thông tin chuyến xe</h3>

                    {bus && (
                        <div className="bus-info">
                            <div className="bus-route">
                                <span className="from">{bus.route?.from_location || 'Điểm đi'}</span>
                                <span className="arrow">→</span>
                                <span className="to">{bus.route?.to_location || 'Điểm đến'}</span>
                            </div>

                            <div className="bus-details">
                                <div className="detail-item">
                                    <span className="label">Ngày khởi hành:</span>
                                    <span className="value">{formatDate(bus.departure_date)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Giờ khởi hành:</span>
                                    <span className="value">{formatTime(bus.departure_time)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Loại xe:</span>
                                    <span className="value">{bus.bus_type || 'Xe khách'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Số hiệu:</span>
                                    <span className="value">{bus.license_plate || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="seats-summary">
                        <h3>Thông tin ghế đã chọn</h3>

                        <div className="selected-seats">
                            <div className="seats-list">
                                {seats.map(seat => (
                                    <div key={seat.id} className="seat-chip">Ghế {seat.seat_number}</div>
                                ))}
                            </div>
                            <div className="seats-total">
                                <div className="total-item">
                                    <span className="label">Số lượng ghế:</span>
                                    <span className="value">{seats.length}</span>
                                </div>
                                <div className="total-item">
                                    <span className="label">Giá mỗi ghế:</span>
                                    <span className="value">{formatPrice(bus?.price || 0)}</span>
                                </div>
                                <div className="total-item total-price">
                                    <span className="label">Tổng tiền:</span>
                                    <span className="value">{formatPrice((bus?.price || 0) * seats.length)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="passenger-form">
                    <h3>Thông tin hành khách</h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="passenger_name">Họ và tên</label>
                            <input
                                type="text"
                                id="passenger_name"
                                name="passenger_name"
                                value={formData.passenger_name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="passenger_phone">Số điện thoại</label>
                            <input
                                type="tel"
                                id="passenger_phone"
                                name="passenger_phone"
                                value={formData.passenger_phone}
                                onChange={handleInputChange}
                                required
                                pattern="[0-9]{10}"
                                title="Số điện thoại phải có 10 chữ số"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="passenger_email">Email</label>
                            <input
                                type="email"
                                id="passenger_email"
                                name="passenger_email"
                                value={formData.passenger_email}
                                onChange={handleInputChange}
                                required
                            />
                            <small>Email xác nhận đặt vé sẽ được gửi đến địa chỉ này</small>
                        </div>

                        <div className="booking-policy">
                            <p>Bằng việc đặt vé, bạn đồng ý với các <a href="/policy">điều khoản và điều kiện</a> của chúng tôi.</p>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-book"
                                disabled={submitting}
                            >
                                {submitting ? 'Đang xử lý...' : 'Đặt vé ngay'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BookingForm;
