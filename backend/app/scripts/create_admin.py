import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.utils.security import get_password_hash

def create_admin_user(email: str, password: str, full_name: str):
    db = SessionLocal()
    try:
        # Kiểm tra email đã tồn tại chưa
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            print(f"Email {email} đã tồn tại!")
            if not user.is_admin:
                user.is_admin = True
                db.commit()
                print(f"Đã cập nhật quyền admin cho tài khoản {email}")
            return
        
        # Tạo tài khoản admin
        admin = models.User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_admin=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"Đã tạo tài khoản admin {email} thành công!")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Tạo tài khoản admin')
    parser.add_argument('--email', required=True, help='Email của admin')
    parser.add_argument('--password', required=True, help='Mật khẩu của admin')
    parser.add_argument('--name', required=True, help='Tên đầy đủ của admin')
    
    args = parser.parse_args()
    
    create_admin_user(args.email, args.password, args.name)