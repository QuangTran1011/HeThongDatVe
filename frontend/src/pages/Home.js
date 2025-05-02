import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function Home() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch routes when component mounts
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/v1/routes');
      setRoutes(response.data);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedRoute) {
      alert('Vui lòng chọn tuyến đường');
      return;
    }

    // Format date as YYYY-MM-DD for API request
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    
    navigate(`/buses?route_id=${selectedRoute}&date=${formattedDate}`);
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Đặt vé xe trực tuyến</h1>
          <p>Dễ dàng, nhanh chóng và tiện lợi</p>
        </div>
      </div>

      <div className="search-container">
        <div className="search-card">
          <h2>Tìm kiếm chuyến xe</h2>
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label htmlFor="route">Tuyến đường</label>
              {loadingRoutes ? (
                <p>Đang tải danh sách tuyến đường...</p>
              ) : (
                <select
                  id="route"
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  required
                >
                  <option value="">-- Chọn tuyến đường --</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.from_location} - {route.to_location}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="date">Ngày đi</label>
              <DatePicker
                id="date"
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                className="date-picker"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || loadingRoutes}>
              {loading ? 'Đang tìm...' : 'Tìm chuyến xe'}
            </button>
          </form>
        </div>
      </div>

      <div className="features-section">
        <h2>Tại sao chọn chúng tôi?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-ticket-alt"></i>
            </div>
            <h3>Đặt vé dễ dàng</h3>
            <p>Đặt vé trực tuyến chỉ với vài bước đơn giản, tiết kiệm thời gian.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-bus"></i>
            </div>
            <h3>Nhiều lựa chọn</h3>
            <p>Đa dạng tuyến đường và loại xe, phù hợp với mọi nhu cầu di chuyển.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <h3>Giá cả hợp lý</h3>
            <p>Cam kết mức giá tốt nhất và nhiều ưu đãi hấp dẫn.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-headset"></i>
            </div>
            <h3>Hỗ trợ 24/7</h3>
            <p>Đội ngũ tư vấn viên luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;