import { Outlet } from 'react-router-dom';
import Header from './Header';

function Layout() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Hệ thống đặt vé xe</p>
      </footer>
    </div>
  );
}

export default Layout;