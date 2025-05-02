import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ setIsAuthenticated, setIsAdmin }) {  // Thêm setIsAdmin vào props
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await axios.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      localStorage.setItem('token', response.data.access_token);
      
      // Lấy thông tin user sau khi đăng nhập thành công
      const userResponse = await axios.get('/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        }
      });
      
      // Kiểm tra nếu người dùng là admin
      const userIsAdmin = userResponse.data.is_admin || false;
      
      // Lưu trạng thái admin vào localStorage
      localStorage.setItem('userRole', userIsAdmin ? 'admin' : 'user');
      
      // Cập nhật state
      setIsAuthenticated(true);
      setIsAdmin(userIsAdmin);
      
      // Chuyển hướng dựa trên vai trò
      if (userIsAdmin) {
        navigate('/admin'); // Chuyển hướng đến trang admin
      } else {
        navigate('/'); // Chuyển hướng đến trang home cho người dùng thông thường
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng nhập</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-link">
          Chưa có tài khoản?{' '}
          <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;