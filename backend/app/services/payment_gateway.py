import requests
import json
import uuid
from typing import Dict, Any, Optional

from app.config import settings

class PaymentGateway:
    def __init__(self):
        self.api_key = settings.PAYMENT_GATEWAY_API_KEY
        self.api_secret = settings.PAYMENT_GATEWAY_SECRET
        self.base_url = settings.PAYMENT_GATEWAY_URL
    
    def create_payment(self, amount: float, description: str, redirect_url: str) -> Dict[str, Any]:
        """Tạo giao dịch thanh toán"""
        endpoint = f"{self.base_url}/payments"
        
        payload = {
            "amount": amount,
            "currency": "VND",
            "description": description,
            "return_url": redirect_url,
            "reference_id": str(uuid.uuid4())
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(endpoint, json=payload, headers=headers)
        return response.json()
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Xác minh trạng thái giao dịch"""
        endpoint = f"{self.base_url}/payments/{transaction_id}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(endpoint, headers=headers)
        return response.json()
    
    def process_refund(self, transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Xử lý hoàn tiền"""
        endpoint = f"{self.base_url}/payments/{transaction_id}/refund"
        
        payload = {}
        if amount:
            payload["amount"] = amount
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(endpoint, json=payload, headers=headers)
        return response.json()