// src/pages/admin/Buses.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaSearch, FaSpinner } from 'react-icons/fa';

// Extract BusModal component to prevent re-renders
const BusModal = ({ showModal, setShowModal, modalMode, formData, routes, handleInputChange, handleAmenityChange, handleSubmit }) => (
  <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ${showModal ? '' : 'hidden'}`}>
    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-semibold mb-4">
        {modalMode === 'create' ? 'Thêm xe mới' : 'Cập nhật thông tin xe'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên xe</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
          <input
            type="text"
            name="license_plate"
            value={formData.license_plate}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Số chỗ ngồi</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleInputChange}
            required
            min="1"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại xe</label>
          <select
            name="bus_type"
            value={formData.bus_type}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          >
            <option value="">-- Chọn loại xe --</option>
            <option value="standard">Tiêu chuẩn</option>
            <option value="luxury">Cao cấp</option>
            <option value="sleeper">Giường nằm</option>
            <option value="limousine">Limousine</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tuyến đường</label>
          <select
            name="route_id"
            value={formData.route_id}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          >
            <option value="">-- Chọn tuyến đường --</option>
            {routes.map(route => (
              <option key={route.id} value={route.id}>
                {route.from_location} - {route.to_location}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khởi hành</label>
          <input
            type="date"
            name="departure_date"
            value={formData.departure_date}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Giờ khởi hành</label>
          <input
            type="time"
            name="departure_time"
            value={formData.departure_time}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé (VNĐ)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="1000"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiện ích</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="amenities"
                value="wifi"
                checked={formData.amenities.includes('wifi')}
                onChange={handleAmenityChange}
                className="mr-2"
              />
              Wifi
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="amenities"
                value="air_conditioner"
                checked={formData.amenities.includes('air_conditioner')}
                onChange={handleAmenityChange}
                className="mr-2"
              />
              Điều hòa
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="amenities"
                value="water"
                checked={formData.amenities.includes('water')}
                onChange={handleAmenityChange}
                className="mr-2"
              />
              Nước uống
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="amenities"
                value="blanket"
                checked={formData.amenities.includes('blanket')}
                onChange={handleAmenityChange}
                className="mr-2"
              />
              Chăn mền
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="amenities"
                value="charging_port"
                checked={formData.amenities.includes('charging_port')}
                onChange={handleAmenityChange}
                className="mr-2"
              />
              Cổng sạc
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="amenities"
                value="entertainment"
                checked={formData.amenities.includes('entertainment')}
                onChange={handleAmenityChange}
                className="mr-2"
              />
              Giải trí
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          ></textarea>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {modalMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Pagination component extracted to prevent re-renders
const Pagination = ({ currentPage, setCurrentPage, buses, limit }) => (
  <div className="mt-6 flex justify-between items-center">
    <div className="text-sm text-gray-500">
      Hiển thị {buses.length} kết quả
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
        disabled={buses.length < limit}
        className={`px-3 py-1 rounded ${buses.length < limit ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        Sau
      </button>
    </div>
  </div>
);

// Format date utility function
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

// Format time utility function
const formatTime = (timeString) => {
  if (!timeString) return '';
  return timeString.substring(0, 5); // Format "HH:MM" from "HH:MM:SS"
};

// Format currency utility function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const AdminBuses = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentBus, setCurrentBus] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    capacity: '',
    description: '',
    bus_type: '',
    route_id: '',
    departure_date: '',
    departure_time: '',
    price: '',
    status: 'active',
    amenities: []
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, [currentPage, limit]);

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

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const skip = (currentPage - 1) * limit;
      
      let url = `/api/v1/buses?skip=${skip}&limit=${limit}`;
      if (search) url += `&search=${search}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBuses(response.data);
    } catch (err) {
      setError('Không thể tải danh sách xe.');
      console.error('Error fetching buses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchBuses();
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      license_plate: '',
      capacity: '',
      description: '',
      bus_type: '',
      route_id: '',
      departure_date: '',
      departure_time: '',
      price: '',
      status: 'active',
      amenities: []
    });
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (bus) => {
    // Format date to YYYY-MM-DD for date input
    const formattedDate = bus.departure_date
      ? new Date(bus.departure_date).toISOString().split('T')[0]
      : '';
  
    // Format time to HH:mm for time input
    const formattedTime = bus.departure_time
      ? new Date(`1970-01-01T${bus.departure_time}`).toISOString().substring(11, 16)
      : '';
  
    setFormData({
      name: bus.name || '',
      license_plate: bus.license_plate || '',
      capacity: bus.capacity || '',
      description: bus.description || '',
      bus_type: bus.bus_type || '',
      route_id: bus.route_id || '',
      departure_date: formattedDate,
      departure_time: formattedTime,
      price: bus.price || '',
      status: bus.status || 'active',
      amenities: bus.amenities || []
    });
    setCurrentBus(bus);
    setModalMode('edit');
    setShowModal(true);
  };
  
  // Use a stable handler to prevent recreating the function on each render
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, value]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        amenities: prev.amenities.filter(item => item !== value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Prepare payload - convert appropriate fields to numbers
      const formPayload = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
        route_id: parseInt(formData.route_id, 10),
        price: parseFloat(formData.price)
      };
      
      let response;
      
      if (modalMode === 'create') {
        response = await axios.post('/api/v1/admin/buses', formPayload, { headers });
        setBuses(prev => [...prev, response.data]);
      } else {
        response = await axios.put(`/api/v1/admin/buses/${currentBus.id}`, formPayload, { headers });
        setBuses(prev => prev.map(bus => bus.id === currentBus.id ? response.data : bus));
      }
      
      setShowModal(false);
      // Thông báo thành công
      alert(modalMode === 'create' ? 'Thêm xe mới thành công!' : 'Cập nhật thông tin xe thành công!');
      
      // Refresh the bus list
      fetchBuses();
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(`Có lỗi xảy ra: ${err.response?.data?.detail || 'Vui lòng thử lại!'}`);
    }
  };

  // Get route name by id
  const getRouteName = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    return route ? `${route.from_location} - ${route.to_location}` : 'N/A';
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return status;
    }
  };

  // Get status style
  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quản lý xe</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Thêm xe mới
        </button>
      </div>
      
      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, biển số xe..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Tìm kiếm
        </button>
      </form>
      
      {/* Bus List */}
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Tên xe</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Biển số</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Tuyến đường</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Giá vé</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {buses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Không tìm thấy xe nào
                    </td>
                  </tr>
                ) : (
                  buses.map(bus => (
                    <tr key={bus.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b">
                        <div>
                          <div className="font-medium">{bus.name}</div>
                          <div className="text-sm text-gray-500">
                            {bus.bus_type === 'standard' && 'Tiêu chuẩn'}
                            {bus.bus_type === 'luxury' && 'Cao cấp'}
                            {bus.bus_type === 'sleeper' && 'Giường nằm'}
                            {bus.bus_type === 'limousine' && 'Limousine'}
                            {' • '}{bus.capacity} chỗ
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">{bus.license_plate}</td>
                      <td className="px-4 py-3 border-b">{getRouteName(bus.route_id)}</td>
                      <td className="px-4 py-3 border-b">
                        <div>{formatDate(bus.departure_date)}</div>
                        <div className="text-sm text-gray-500">{formatTime(bus.departure_time)}</div>
                      </td>
                      <td className="px-4 py-3 border-b">{formatCurrency(bus.price)}</td>
                      <td className="px-4 py-3 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(bus.status)}`}>
                          {getStatusText(bus.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <button
                          onClick={() => openEditModal(bus)}
                          className="flex items-center px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          <FaEdit className="mr-1" /> Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {buses.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              buses={buses}
              limit={limit}
            />
          )}
        </>
      )}
      
      {/* Modal Component */}
      <BusModal 
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        formData={formData}
        routes={routes}
        handleInputChange={handleInputChange}
        handleAmenityChange={handleAmenityChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

export default AdminBuses;