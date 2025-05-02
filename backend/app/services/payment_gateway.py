from typing import Dict, Any, Optional
import uuid
from app.config import settings
from app.services.mock_payment_gateway import MockPaymentGateway

class PaymentGateway:
    """
    Lớp thanh toán chính, sử dụng MockPaymentGateway trong môi trường phát triển
    và có thể dễ dàng chuyển sang cổng thanh toán thực trong môi trường sản xuất
    """
    def __init__(self):
        self.use_mock = settings.USE_MOCK_PAYMENT or True
        
        if self.use_mock:
            # Sử dụng cổng thanh toán giả
            self._gateway = MockPaymentGateway()
        else:
            # Cấu hình cổng thanh toán thực tế
            self.api_key = settings.PAYMENT_GATEWAY_API_KEY
            self.api_secret = settings.PAYMENT_GATEWAY_SECRET
            self.base_url = settings.PAYMENT_GATEWAY_URL
    
    def create_payment(self, amount: float, description: str, redirect_url: str) -> Dict[str, Any]:
        """
        Tạo giao dịch thanh toán mới
        """
        if self.use_mock:
            return self._gateway.create_payment(amount, description, redirect_url)
        else:
            # Triển khai kết nối đến cổng thanh toán thực tế
            # Mã này sẽ được thay thế bằng tích hợp thực tế
            raise NotImplementedError("Cổng thanh toán thực chưa được triển khai")
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """
        Xác minh trạng thái của một giao dịch
        """
        if self.use_mock:
            return self._gateway.verify_payment(transaction_id)
        else:
            # Triển khai kết nối đến cổng thanh toán thực tế
            raise NotImplementedError("Cổng thanh toán thực chưa được triển khai")
    
    def process_refund(self, transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Xử lý hoàn tiền cho một giao dịch
        """
        if self.use_mock:
            return self._gateway.process_refund(transaction_id, amount)
        else:
            # Triển khai kết nối đến cổng thanh toán thực tế
            raise NotImplementedError("Cổng thanh toán thực chưa được triển khai")
    
    # Phương thức này chỉ có trong môi trường phát triển
    def simulate_payment_completion(self, transaction_id: str, success: bool = True) -> Dict[str, Any]:
        """
        Giả lập việc hoàn thành thanh toán (chỉ dùng cho kiểm thử)
        """
        if self.use_mock:
            return self._gateway.simulate_payment_completion(transaction_id, success)
        else:
            raise RuntimeError("Phương thức này chỉ khả dụng trong môi trường giả lập")