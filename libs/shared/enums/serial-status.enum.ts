export enum SerialStatus {
  AVAILABLE = 'AVAILABLE', // Đang trong kho, sẵn sàng bán
  SOLD = 'SOLD',           // Đã bán cho khách
  DEFECTIVE = 'DEFECTIVE', // Hàng lỗi
  TRANSFERRING = 'TRANSFERRING', // Đang chuyển kho
  WARRANTY = 'WARRANTY' // Đang bảo hành
}
