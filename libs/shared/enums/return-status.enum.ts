export enum ReturnStatus {
  PENDING = 'PENDING',     // Đang chờ kiểm tra kỹ thuật
  COMPLETED = 'COMPLETED', // Đã nhập lại vào kho lỗi/kho bảo hành
  REJECTED = 'REJECTED'    // Từ chối bảo hành (VD: Rơi vỡ, rớt nước)
}