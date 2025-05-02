import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Home from './pages/Home';
import BusList from './pages/BusList';
import BusDetail from './pages/BusDetail';
import BookingForm from './pages/BookingForm';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings'; // Make sure this import is correct
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBookings from './pages/admin/Bookings';
import AdminStatistics from './pages/admin/Statistics';
import AdminBuses from './pages/admin/Buses';
import AdminRoutes from './pages/admin/Routes';

import './App.css';
import './index.css'


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (token) {
      setIsAuthenticated(true);
      setIsAdmin(userRole === 'admin');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Trang người dùng thông thường */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/buses" element={<BusList />} />
          <Route path="/buses/:busId" element={<BusDetail />} />
          
          {/* Routes mới cho booking */}
          <Route path="/booking" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <BookingForm />
            </ProtectedRoute>
          } />
          <Route path="/booking/confirmation/:bookingCode" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <BookingConfirmation />
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MyBookings />
            </ProtectedRoute>
          } />
          
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} setIsAdmin={setIsAdmin} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route path="/profile" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Trang dành cho admin */}
        <Route path="/admin" element={
          <ProtectedRoute isAuthenticated={isAuthenticated && isAdmin}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="statistics" element={<AdminStatistics />} />
          <Route path="buses" element={<AdminBuses />} />
          <Route path="routes" element={<AdminRoutes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;