export enum OrderStatus {
  PENDING = 'PENDING',       // Sale vừa tạo, chờ Kho xử lý
  PROCESSING = 'PROCESSING', // Kho đang nhặt hàng/đóng gói
  SHIPPED = 'SHIPPED',       // Đã xuất kho / Đang giao
  DELIVERED = 'DELIVERED',   // Giao thành công (Ghi nhận doanh thu)
  CANCELLED = 'CANCELLED'    // Hủy đơn
}
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL', // Trả góp / Cọc
  PAID = 'PAID'
}