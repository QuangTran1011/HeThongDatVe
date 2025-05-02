import uuid
import random
from datetime import datetime
from typing import Dict, Any, Optional

class MockPaymentGateway:
    """
    Lớp giả lập cổng thanh toán để sử dụng trong môi trường phát triển
    """
    def __init__(self):
        # Database đơn giản để lưu trữ các giao dịch
        self.transactions = {}
        self.refunds = {}
        
    def create_payment(self, amount: float, description: str, redirect_url: str) -> Dict[str, Any]:
        """
        Tạo một giao dịch thanh toán mới
        """
        transaction_id = str(uuid.uuid4())
        
        # Tạo URL giả để redirect đến trang thanh toán
        payment_url = f"http://mock-payment.example.com/pay?id={transaction_id}&amount={amount}&redirect={redirect_url}"
        
        # Lưu thông tin giao dịch
        self.transactions[transaction_id] = {
            "id": transaction_id,
            "amount": amount,
            "description": description,
            "redirect_url": redirect_url,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "updated_at": None
        }
        
        return {
            "transaction_id": transaction_id,
            "payment_url": payment_url,
            "status": "pending"
        }
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """
        Xác minh trạng thái của một giao dịch
        Trong môi trường giả lập, chúng ta sẽ ngẫu nhiên quyết định giao dịch thành công hay thất bại
        """
        if transaction_id not in self.transactions:
            return {"status": "error", "message": "Giao dịch không tồn tại"}
        
        transaction = self.transactions[transaction_id]
        
        # Nếu trạng thái vẫn đang pending, hãy ngẫu nhiên quyết định kết quả
        if transaction["status"] == "pending":
            # 80% xác suất giao dịch thành công, 20% thất bại
            if random.random() < 0.8:
                transaction["status"] = "success"
            else:
                transaction["status"] = "failed"
            
            transaction["updated_at"] = datetime.now().isoformat()
            self.transactions[transaction_id] = transaction
        
        return {
            "transaction_id": transaction_id,
            "amount": transaction["amount"],
            "status": transaction["status"],
            "created_at": transaction["created_at"],
            "updated_at": transaction["updated_at"]
        }
    
    def process_refund(self, transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Xử lý hoàn tiền cho một giao dịch
        """
        if transaction_id not in self.transactions:
            return {"status": "error", "message": "Giao dịch không tồn tại"}
        
        transaction = self.transactions[transaction_id]
        
        # Kiểm tra xem giao dịch có thành công không
        if transaction["status"] != "success":
            return {"status": "error", "message": "Chỉ có thể hoàn tiền cho các giao dịch thành công"}
        
        # Nếu không có số tiền cụ thể, hoàn lại toàn bộ
        refund_amount = amount if amount is not None else transaction["amount"]
        
        # Kiểm tra số tiền hoàn lại không lớn hơn số tiền giao dịch
        if refund_amount > transaction["amount"]:
            return {"status": "error", "message": "Số tiền hoàn lại không thể lớn hơn số tiền giao dịch"}
        
        refund_id = str(uuid.uuid4())
        
        # Lưu thông tin hoàn tiền
        self.refunds[refund_id] = {
            "refund_id": refund_id,
            "transaction_id": transaction_id,
            "amount": refund_amount,
            "status": "success",
            "created_at": datetime.now().isoformat()
        }
        
        # Cập nhật trạng thái giao dịch
        transaction["status"] = "refunded"
        transaction["updated_at"] = datetime.now().isoformat()
        self.transactions[transaction_id] = transaction
        
        return {
            "status": "success",
            "refund_id": refund_id,
            "transaction_id": transaction_id,
            "amount": refund_amount
        }
    
    # Phương thức này chỉ có trong môi trường giả lập để giúp kiểm thử
    def simulate_payment_completion(self, transaction_id: str, success: bool = True) -> Dict[str, Any]:
        """
        Giả lập việc hoàn thành thanh toán (chỉ dùng cho kiểm thử)
        """
        if transaction_id not in self.transactions:
            return {"status": "error", "message": "Giao dịch không tồn tại"}
        
        transaction = self.transactions[transaction_id]
        
        if transaction["status"] != "pending":
            return {"status": "error", "message": "Giao dịch không ở trạng thái chờ thanh toán"}
        
        transaction["status"] = "success" if success else "failed"
        transaction["updated_at"] = datetime.now().isoformat()
        self.transactions[transaction_id] = transaction
        
        return {
            "transaction_id": transaction_id,
            "status": transaction["status"],
            "amount": transaction["amount"],
            "updated_at": transaction["updated_at"]
        }