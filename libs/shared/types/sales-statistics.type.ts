export interface ISalesDashboard {
  // 1. Chỉ số nóng (Real-time)
  metrics: {
    todayRevenue: number;     // Doanh thu trong ngày
    monthRevenue: number;     // Doanh thu trong tháng
    pendingOrders: number;    // Số đơn đang chờ Kho xử lý (Cần hối thúc)
    cancelRate: number;       // Tỷ lệ hủy đơn (Bom hàng) %
  };

  // 2. Bảng xếp hạng Nhân viên Sale (KPI)
  topStaffs: Array<{
    rank: number;
    staffName: string;
    totalOrders: number;
    totalRevenue: number;
  }>;

  // 3. Khách hàng VIP trong tháng
  topCustomers: Array<{
    customerName: string;
    phone: string;
    totalSpent: number;
  }>;
}

export type SalesDashboardFilterDto = {
  month?: string; // VD: '2' hoặc '12'
  year?: string;  // VD: '2026'
}