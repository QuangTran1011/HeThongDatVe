import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function BusList() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState({
    time: 'all',
    price: 'all'
  });

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const routeId = queryParams.get('route_id');
  const date = queryParams.get('date');
  
  useEffect(() => {
    if (routeId && date) {
      fetchBuses();
    } else {
      setError('Thông tin tìm kiếm không hợp lệ');
      setLoading(false);
    }
  }, [routeId, date]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/v1/buses?route_id=${routeId}&date=${date}`);
      setBuses(response.data);
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError('Không thể tải danh sách xe. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBus = (busId) => {
    navigate(`/buses/${busId}`);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Format "HH:MM" from "HH:MM:SS"
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Apply filters
  const filteredBuses = buses.filter(bus => {
    let matchesTimeFilter = true;
    let matchesPriceFilter = true;
    
    // Extract hour from departure_time
    // Make sure we correctly parse the departure_time which could be in different formats
    let departureHour;
    
    if (bus.departure_time) {
      // Check if departure_time is a string that contains only time (HH:MM:SS)
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(bus.departure_time)) {
        // If it's just a time string like "14:30:00", extract the hour
        departureHour = parseInt(bus.departure_time.split(':')[0], 10);
      } else {
        // Otherwise, assume it's a full date-time string and parse it
        departureHour = new Date(bus.departure_time).getHours();
      }
    } else {
      // Default to noon if no departure time is available
      departureHour = 12;
    }
    
    // Filter by time of day
    if (selectedFilters.time === 'morning') {
      matchesTimeFilter = departureHour >= 5 && departureHour < 12;
    } else if (selectedFilters.time === 'afternoon') {
      matchesTimeFilter = departureHour >= 12 && departureHour < 17;
    } else if (selectedFilters.time === 'evening') {
      matchesTimeFilter = departureHour >= 17 && departureHour < 23;
    } else if (selectedFilters.time === 'night') {
      matchesTimeFilter = departureHour >= 23 || departureHour < 5;
    }
    
    // Filter by price range
    if (selectedFilters.price === 'low') {
      matchesPriceFilter = bus.price < 200000;
    } else if (selectedFilters.price === 'medium') {
      matchesPriceFilter = bus.price >= 200000 && bus.price < 400000;
    } else if (selectedFilters.price === 'high') {
      matchesPriceFilter = bus.price >= 400000;
    }
    
    return matchesTimeFilter && matchesPriceFilter;
  });

  return (
    <div className="buses-container">
      <div className="search-info">
        <h2>Kết quả tìm kiếm</h2>
        {routeId && date && (
          <p>
            {/* Displaying route details - in a real app, you'd fetch route info */}
            Ngày khởi hành: {formatDate(date)}
          </p>
        )}
      </div>

      <div className="bus-list-container">
        <div className="filters-container">
          <h3>Bộ lọc</h3>
          <div className="filter-group">
            <h4>Thời gian khởi hành</h4>
            <div className="filter-options">
              <label>
                <input
                  type="radio"
                  name="time"
                  value="all"
                  checked={selectedFilters.time === 'all'}
                  onChange={() => handleFilterChange('time', 'all')}
                />
                Tất cả
              </label>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="morning"
                  checked={selectedFilters.time === 'morning'}
                  onChange={() => handleFilterChange('time', 'morning')}
                />
                Sáng (5:00 - 11:59)
              </label>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="afternoon"
                  checked={selectedFilters.time === 'afternoon'}
                  onChange={() => handleFilterChange('time', 'afternoon')}
                />
                Chiều (12:00 - 16:59)
              </label>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="evening"
                  checked={selectedFilters.time === 'evening'}
                  onChange={() => handleFilterChange('time', 'evening')}
                />
                Tối (17:00 - 22:59)
              </label>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="night"
                  checked={selectedFilters.time === 'night'}
                  onChange={() => handleFilterChange('time', 'night')}
                />
                Đêm (23:00 - 4:59)
              </label>
            </div>
          </div>

          <div className="filter-group">
            <h4>Giá vé</h4>
            <div className="filter-options">
              <label>
                <input
                  type="radio"
                  name="price"
                  value="all"
                  checked={selectedFilters.price === 'all'}
                  onChange={() => handleFilterChange('price', 'all')}
                />
                Tất cả
              </label>
              <label>
                <input
                  type="radio"
                  name="price"
                  value="low"
                  checked={selectedFilters.price === 'low'}
                  onChange={() => handleFilterChange('price', 'low')}
                />
                Dưới 200,000đ
              </label>
              <label>
                <input
                  type="radio"
                  name="price"
                  value="medium"
                  checked={selectedFilters.price === 'medium'}
                  onChange={() => handleFilterChange('price', 'medium')}
                />
                200,000đ - 400,000đ
              </label>
              <label>
                <input
                  type="radio"
                  name="price"
                  value="high"
                  checked={selectedFilters.price === 'high'}
                  onChange={() => handleFilterChange('price', 'high')}
                />
                Trên 400,000đ
              </label>
            </div>
          </div>
        </div>

        <div className="bus-list">
          {loading ? (
            <div className="loading">Đang tải danh sách xe...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredBuses.length === 0 ? (
            <div className="no-results">Không tìm thấy chuyến xe phù hợp với tiêu chí tìm kiếm.</div>
          ) : (
            <>
              <p>Có {filteredBuses.length} chuyến xe phù hợp</p>
              {filteredBuses.map((bus) => (
                <div key={bus.id} className="bus-card" onClick={() => handleSelectBus(bus.id)}>
                  <div className="bus-info">
                    <h3>{bus.bus_type || 'Xe khách'}</h3>
                    <div className="time-info">
                      <div className="departure">
                        <p className="time">{formatTime(bus.departure_time)}</p>
                        {/* <p>Điểm đi</p> */}
                      </div>
                      {/* Loại bỏ journey_duration và arrival_time */}
                    </div>
                    <div className="bus-details">
                      <div className="detail">
                        <span className="label">Biển số:</span>
                        <span>{bus.license_plate || '---'}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Tiện ích:</span>
                        <span>{bus.amenities ? bus.amenities.join(', ') : 'Wifi, Nước, Điều hòa'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bus-price">
                    <p className="price">{formatPrice(bus.price || 250000)}</p>
                    <button className="btn-select">Chọn chuyến</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusList;