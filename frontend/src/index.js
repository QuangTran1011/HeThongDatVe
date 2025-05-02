import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext'; // thêm dòng này

// Bọc App trong AuthProvider
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>   {/* bọc App bằng AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Nếu bạn muốn đo lường hiệu suất, có thể giữ lại dòng dưới
reportWebVitals();
