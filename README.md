# Hướng dẫn cài đặt và chạy dự án

## Yêu cầu hệ thống
- Python 3.8 trở lên
- Node.js và npm

## Cài đặt và chạy Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt các thư viện Python cần thiết:
```bash
pip install -r requirements.txt
```

3. Chạy server backend:
```bash
python -m uvicorn app.main:app --reload
```
Server backend sẽ chạy tại địa chỉ: http://localhost:8000

## Cài đặt và chạy Frontend

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt các thư viện Node.js:
```bash
npm install
```

3. Chạy ứng dụng frontend:
```bash
npm start
```
Ứng dụng frontend sẽ chạy tại địa chỉ: http://localhost:3000

## Lưu ý
- Đảm bảo backend server đang chạy trước khi khởi động frontend
- Kiểm tra file .env trong thư mục backend để cấu hình các biến môi trường nếu cần thiết