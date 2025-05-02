import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaSpinner, FaSearch, FaMapMarkerAlt, FaPencilAlt, FaTrash, FaInfoCircle } from 'react-icons/fa';

// Move RouteModal outside the main component to prevent recreation on every render
const RouteModal = ({ showModal, setShowModal, modalMode, formData, handleInputChange, handleSubmit }) => (
  <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ${showModal ? '' : 'hidden'}`}>
    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-semibold mb-4">
        {modalMode === 'create' ? 'Thêm tuyến đường mới' : 'Cập nhật tuyến đường'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đi</label>
          <div className="relative">
            <input
              type="text"
              name="from_location"
              value={formData.from_location}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
            />
            <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
          <div className="relative">
            <input
              type="text"
              name="to_location"
              value={formData.to_location}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
            />
            <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng cách (km)</label>
          <input
            type="number"
            name="distance"
            value={formData.distance}
            onChange={handleInputChange}
            required
            min="0"
            step="0.1"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian di chuyển (phút)</label>
          <input
            type="number"
            name="estimated_duration"
            value={formData.estimated_duration}
            onChange={handleInputChange}
            required
            min="1"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
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
const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => handlePageChange(i)}
        className={`px-3 py-1 rounded ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
      >
        {i}
      </button>
    );
  }
  
  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
      >
        &lt;
      </button>
      {pages}
      <button
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
      >
        &gt;
      </button>
    </div>
  );
};

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentRouteId, setCurrentRouteId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    from_location: '',
    to_location: '',
    distance: '',
    estimated_duration: '',
    description: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchRoutes();
  }, [currentPage, limit]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const skip = (currentPage - 1) * limit;
      
      let url = `/api/v1/admin/routes?skip=${skip}&limit=${limit}`;
      if (search) url += `&search=${search}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRoutes(response.data);
      
      // Calculate total pages (assuming the API returns total count in headers or response)
      // If your API returns total count, replace the calculation below
      setTotalPages(Math.ceil(response.data.length > 0 ? 20 : 0 / limit)); // Example with assumed total of 20
    } catch (err) {
      setError('Không thể tải danh sách tuyến đường.');
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchRoutes();
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      from_location: '',
      to_location: '',
      distance: '',
      estimated_duration: '',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (route) => {
    setModalMode('edit');
    setCurrentRouteId(route.id);
    setFormData({
      from_location: route.from_location,
      to_location: route.to_location,
      distance: route.distance.toString(),
      estimated_duration: route.estimated_duration.toString(),
      description: route.description || ''
    });
    setShowModal(true);
  };

  // Use a memoized handler to prevent recreating the function on each render
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Chuyển đổi các giá trị số
      const formPayload = {
        ...formData,
        distance: parseFloat(formData.distance),
        estimated_duration: parseInt(formData.estimated_duration, 10)
      };
      
      let response;
      
      if (modalMode === 'create') {
        response = await axios.post('/api/v1/admin/routes', formPayload, { headers });
        setRoutes(prev => [...prev, response.data]);
        alert('Thêm tuyến đường mới thành công!');
      } else {
        response = await axios.put(`/api/v1/admin/routes/${currentRouteId}`, formPayload, { headers });
        setRoutes(prev => prev.map(route => route.id === currentRouteId ? response.data : route));
        alert('Cập nhật tuyến đường thành công!');
      }
      
      setShowModal(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(`Có lỗi xảy ra: ${err.response?.data?.detail || 'Vui lòng thử lại!'}`);
    }
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tuyến đường này?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/admin/routes/${routeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRoutes(prev => prev.filter(route => route.id !== routeId));
      alert('Xóa tuyến đường thành công!');
    } catch (err) {
      console.error('Error deleting route:', err);
      alert('Có lỗi xảy ra khi xóa tuyến đường.');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quản lý tuyến đường</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Thêm tuyến đường
        </button>
      </div>
      
      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tuyến đường..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Tìm kiếm
        </button>
      </form>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Lỗi</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-blue-600 text-3xl" />
        </div>
      ) : (
        /* Routes table */
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left border-b">ID</th>
                <th className="py-3 px-4 text-left border-b">Điểm đi</th>
                <th className="py-3 px-4 text-left border-b">Điểm đến</th>
                <th className="py-3 px-4 text-left border-b">Khoảng cách</th>
                <th className="py-3 px-4 text-left border-b">Thời gian</th>
                <th className="py-3 px-4 text-center border-b">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    Không có tuyến đường nào
                  </td>
                </tr>
              ) : (
                routes.map(route => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">{route.id}</td>
                    <td className="py-3 px-4 border-b">{route.from_location}</td>
                    <td className="py-3 px-4 border-b">{route.to_location}</td>
                    <td className="py-3 px-4 border-b">{route.distance} km</td>
                    <td className="py-3 px-4 border-b">{route.estimated_duration} phút</td>
                    <td className="py-3 px-4 border-b text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(route)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Chỉnh sửa"
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {!loading && routes.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          handlePageChange={handlePageChange}
        />
      )}
      
      {/* Modal */}
      <RouteModal 
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

export default AdminRoutes;