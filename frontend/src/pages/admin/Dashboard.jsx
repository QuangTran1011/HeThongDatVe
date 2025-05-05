import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaTicketAlt, 
  FaBus, 
  FaRoute, 
  FaMoneyBillWave, 
  FaCalendarAlt,
  FaChartLine
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalBuses: 0,
    totalRoutes: 0,
    pendingBookings: 0,
    activeRoutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch statistics
      const statsResponse = await axios.get('/api/v1/admin/statistics', { headers });

      // Fetch routes
      const routesResponse = await axios.get('/api/v1/routes', { headers });
      const routesCount = Array.isArray(routesResponse.data) ? routesResponse.data.length : 0;

      // Fetch buses
      const busesResponse = await axios.get('/api/v1/buses', { headers });
      const busesCount = Array.isArray(busesResponse.data) ? busesResponse.data.length : 0;

      // Fetch pending bookings
      const pendingResponse = await axios.get('/api/v1/admin/bookings?status=pending', { headers });
      const pendingCount = Array.isArray(pendingResponse.data) ? pendingResponse.data.length : 0;

      setSummary({
        totalBookings: statsResponse.data?.total_bookings || 0,
        totalRevenue: statsResponse.data?.total_revenue || 0,
        totalBuses: busesCount,
        totalRoutes: routesCount,
        pendingBookings: pendingCount,
        activeRoutes: routesCount
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.');

      // Sample placeholder for dev
      setSummary({
        totalBookings: 156,
        totalRevenue: 45600000,
        totalBuses: 12,
        totalRoutes: 8,
        pendingBookings: 5,
        activeRoutes: 6
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const DashboardCard = ({ title, value, icon, bgColor, linkTo }) => (
    <Link to={linkTo} className={`block p-6 rounded-lg shadow hover:shadow-md transition-shadow ${bgColor} text-white`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-lg font-medium mb-1 opacity-80">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </Link>
  );

  const QuickAction = ({ title, icon, linkTo, bgColor }) => (
    <Link to={linkTo} className={`flex items-center p-4 rounded-lg shadow ${bgColor} text-white hover:shadow-md transition-shadow`}>
      <div className="text-2xl mr-3">{icon}</div>
      <span className="font-medium">{title}</span>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Lỗi</p>
          <p>{error}</p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Bảng điều khiển</h1>
        <p className="text-gray-600">Xem tổng quan về hệ thống đặt vé xe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Tổng đơn đặt vé" 
          value={summary.totalBookings} 
          icon={<FaTicketAlt />} 
          bgColor="bg-blue-600" 
          linkTo="/admin/bookings" 
        />
        <DashboardCard 
          title="Doanh thu" 
          value={formatCurrency(summary.totalRevenue)} 
          icon={<FaMoneyBillWave />} 
          bgColor="bg-green-600" 
          linkTo="/admin/statistics" 
        />
        <DashboardCard 
          title="Tổng số xe" 
          value={summary.totalBuses} 
          icon={<FaBus />} 
          bgColor="bg-purple-600" 
          linkTo="/admin/buses" 
        />
        <DashboardCard 
          title="Tổng tuyến đường" 
          value={summary.totalRoutes} 
          icon={<FaRoute />} 
          bgColor="bg-yellow-600" 
          linkTo="/admin/routes" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-500" /> Đang chờ xử lý
          </h3>
          <div className="text-3xl font-bold text-blue-700">{summary.pendingBookings}</div>
          <p className="text-gray-600 mt-2">Đơn đặt vé đang chờ xử lý</p>
          <Link to="/admin/bookings?status=pending" className="text-blue-600 font-medium mt-4 inline-block hover:underline">
            Xem chi tiết →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaRoute className="mr-2 text-green-500" /> Tuyến đang hoạt động
          </h3>
          <div className="text-3xl font-bold text-green-700">{summary.activeRoutes}</div>
          <p className="text-gray-600 mt-2">Tuyến đường đang hoạt động</p>
          <Link to="/admin/routes" className="text-green-600 font-medium mt-4 inline-block hover:underline">
            Quản lý tuyến →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2 text-purple-500" /> Thống kê doanh thu
          </h3>
          <p className="text-gray-600">Xem báo cáo chi tiết về doanh thu theo tuyến đường, thời gian</p>
          <Link to="/admin/statistics" className="text-purple-600 font-medium mt-4 inline-block hover:underline">
            Xem thống kê →
          </Link>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction title="Thêm tuyến đường" icon={<FaRoute />} linkTo="/admin/routes" bgColor="bg-blue-600" />
          <QuickAction title="Thêm xe mới" icon={<FaBus />} linkTo="/admin/buses" bgColor="bg-green-600" />
          <QuickAction title="Quản lý đặt vé" icon={<FaTicketAlt />} linkTo="/admin/bookings" bgColor="bg-yellow-600" />
          <QuickAction title="Thống kê doanh thu" icon={<FaChartLine />} linkTo="/admin/statistics" bgColor="bg-purple-600" />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
