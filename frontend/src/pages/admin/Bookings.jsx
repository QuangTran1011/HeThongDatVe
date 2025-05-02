// src/pages/admin/Bookings.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaSpinner } from 'react-icons/fa';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const skip = (currentPage - 1) * limit;
      
      let url = `/api/v1/admin/bookings?skip=${skip}&limit=${limit}`;
      if (search) url += `&search=${search}`;
      if (status) url += `&status=${status}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBookings(response.data);
    } catch (err) {
      setError('Không thể tải danh sách đơn đặt vé.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentPage, limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    // Fetch với các giá trị mặc định
    setTimeout(fetchBookings, 0);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/v1/admin/bookings/${bookingId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Cập nhật trạng thái trong state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? {...booking, status: newStatus} : booking
      ));
    } catch (err) {
      alert('Không thể cập nhật trạng thái đơn hàng.');
      console.error('Error updating booking status:', err);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Quản lý đơn đặt vé</h2>
      
      {/* Filter form */}
      <form onSubmit={handleSearch} className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên, email, mã đơn..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="cancelled">Đã hủy</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Đặt lại
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Lọc dữ liệu
          </button>
        </div>
      </form>
      
      {/* Booking list */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-blue-600 text-3xl" />
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Mã đơn</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Tuyến đường</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Số ghế</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      Không tìm thấy đơn đặt vé nào
                    </td>
                  </tr>
                ) : (
                  bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b">{booking.id}</td>
                      <td className="px-4 py-3 border-b">
                        <div>{booking.user?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        {booking.trip?.route?.departure} - {booking.trip?.route?.destination}
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div>{new Date(booking.trip?.departure_time).toLocaleDateString('vi-VN')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.trip?.departure_time).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">{booking.seats?.length || 0}</td>
                      <td className="px-4 py-3 border-b">{booking.total_price?.toLocaleString('vi-VN')} VNĐ</td>
                      <td className="px-4 py-3 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                          disabled={booking.status === 'completed' || booking.status === 'cancelled'}
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Xác nhận</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="cancelled">Hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Hiển thị {bookings.length} kết quả
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Trước
              </button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={bookings.length < limit}
                className={`px-3 py-1 rounded ${bookings.length < limit ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminBookings;