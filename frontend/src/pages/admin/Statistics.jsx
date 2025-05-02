// src/pages/admin/Statistics.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaCalendarAlt } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [routeId, setRouteId] = useState('');
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    // Tải danh sách tuyến đường để lọc
    const fetchRoutes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/v1/routes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoutes(response.data);
      } catch (err) {
        console.error('Error fetching routes:', err);
      }
    };

    fetchRoutes();
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = '/api/v1/admin/statistics?';
      
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      if (routeId) url += `&route_id=${routeId}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatistics(response.data);
    } catch (err) {
      setError('Không thể tải dữ liệu thống kê.');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchStatistics();
  };

  const prepareChartData = () => {
    if (!statistics || !statistics.daily_sales) return [];
    
    return Object.entries(statistics.daily_sales).map(([date, value]) => ({
      date,
      revenue: value.revenue,
      bookings: value.bookings,
      seats: value.seats
    }));
  };

  const prepareRouteData = () => {
    if (!statistics || !statistics.routes_performance) return [];
    
    return Object.entries(statistics.routes_performance).map(([routeName, data]) => ({
      routeName,
      revenue: data.revenue,
      bookings: data.bookings,
      seats: data.seats
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Thống kê doanh thu và hoạt động</h2>
      
      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tuyến đường</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Tất cả tuyến đường</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.departure} - {route.destination}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Áp dụng
          </button>
        </div>
      </form>
      
      {/* Statistics Display */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-blue-600 text-3xl" />
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">{error}</div>
      ) : statistics ? (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-blue-700">Tổng doanh thu</h3>
              <p className="text-2xl font-bold text-blue-800 mt-2">
                {statistics.total_revenue?.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-green-700">Tổng đơn hàng</h3>
              <p className="text-2xl font-bold text-green-800 mt-2">
                {statistics.total_bookings} đơn
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-purple-700">Số ghế đã bán</h3>
              <p className="text-2xl font-bold text-purple-800 mt-2">
                {statistics.total_seats} ghế
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-yellow-700">Tỷ lệ lấp đầy</h3>
              <p className="text-2xl font-bold text-yellow-800 mt-2">
                {statistics.fill_rate ? `${(statistics.fill_rate * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Line Chart - Daily Sales */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Doanh thu theo ngày</h3>
            <div className="h-80 bg-gray-50 p-4 rounded-lg shadow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu (VNĐ)" stroke="#3b82f6" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" name="Số đơn" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Bar Chart - Route Performance */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Hiệu suất theo tuyến đường</h3>
            <div className="h-80 bg-gray-50 p-4 rounded-lg shadow">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepareRouteData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="routeName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" name="Doanh thu (VNĐ)" fill="#3b82f6" />
                  <Bar dataKey="seats" name="Số ghế đã bán" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Routes Table */}
          <div>
            <h3 className="text-lg font-medium mb-4">Tuyến đường hiệu quả nhất</h3>
            <div className="overflow-x-auto bg-gray-50 rounded-lg shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Tuyến đường</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Doanh thu</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Số đơn</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Số ghế</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Tỷ lệ lấp đầy</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.top_routes ? (
                    statistics.top_routes.map((route, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b">{route.name}</td>
                        <td className="px-4 py-3 border-b">{route.revenue.toLocaleString('vi-VN')} VNĐ</td>
                        <td className="px-4 py-3 border-b">{route.bookings}</td>
                        <td className="px-4 py-3 border-b">{route.seats}</td>
                        <td className="px-4 py-3 border-b">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${(route.fill_rate * 100).toFixed(1)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {(route.fill_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-gray-500">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">Không có dữ liệu thống kê</div>
      )}
    </div>
  );
};

export default AdminStatistics;