export enum WarehouseType {
  CENTRAL = 'CENTRAL', // Kho tổng (Chỉ nhập/xuất, không bán lẻ)
  STORE = 'STORE',     // Cửa hàng (Có thể bán lẻ trực tiếp)
  DAMAGED = 'DAMAGED'  // Kho hàng lỗi (Chứa hàng hỏng chờ hủy/trả)
}

export enum StockChangeType {
  IMPORT = 'IMPORT',       // Nhập kho
  EXPORT = 'EXPORT',       // Xuất bán
  TRANSFER = 'TRANSFER',   // Chuyển kho
  ADJUSTMENT = 'ADJUSTMENT' // Kiểm kê/Điều chỉnh (Cân bằng kho)
}