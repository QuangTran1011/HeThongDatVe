import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { FaTicketAlt, FaChartBar, FaBus, FaRoute, FaTachometerAlt, FaBars, FaSignOutAlt } from 'react-icons/fa';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-gray-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-md hover:bg-gray-700">
            <FaBars />
          </button>
        </div>
        <nav className="mt-6">
          <NavLink to="/admin" end className={({isActive}) => 
            `flex items-center p-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <FaTachometerAlt className="mr-4" />
            {sidebarOpen && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/admin/bookings" className={({isActive}) => 
            `flex items-center p-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <FaTicketAlt className="mr-4" />
            {sidebarOpen && <span>Đơn đặt vé</span>}
          </NavLink>
          <NavLink to="/admin/statistics" className={({isActive}) => 
            `flex items-center p-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <FaChartBar className="mr-4" />
            {sidebarOpen && <span>Thống kê</span>}
          </NavLink>
          <NavLink to="/admin/buses" className={({isActive}) => 
            `flex items-center p-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <FaBus className="mr-4" />
            {sidebarOpen && <span>Quản lý xe</span>}
          </NavLink>
          <NavLink to="/admin/routes" className={({isActive}) => 
            `flex items-center p-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <FaRoute className="mr-4" />
            {sidebarOpen && <span>Tuyến đường</span>}
          </NavLink>
          <button onClick={handleLogout} className="flex items-center p-4 w-full text-left hover:bg-gray-700 text-red-400">
            <FaSignOutAlt className="mr-4" />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <header className="bg-white shadow">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-semibold text-gray-800">Hệ thống quản trị đặt vé xe</h1>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 