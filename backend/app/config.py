from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bus Ticket System API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "postgresql://postgres:secret123@localhost:5432/mydb"
    
    SMTP_HOST : str = os.getenv("SMTP_HOST", 'smtp.gmail.com')
    SMTP_PORT: int = os.getenv("SMTP_PORT", 587)
    SMTP_USER : str = os.getenv("SMTP_USER", 'trancongdata@gmail.com')
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", 'jvsm lery arud iwjy')
    SMTP_TLS : bool = True
    EMAIL_TEMPLATES_DIR: str = "app/email-templates"
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "info@busticketsystem.com")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "Bus Ticket System")
    
    # Thông tin cổng thanh toán
    PAYMENT_GATEWAY_API_KEY: str = os.getenv("PAYMENT_GATEWAY_API_KEY", "")
    PAYMENT_GATEWAY_SECRET: str = os.getenv("PAYMENT_GATEWAY_SECRET", "")
    PAYMENT_GATEWAY_URL: str = os.getenv("PAYMENT_GATEWAY_URL", "")

settings = Settings()