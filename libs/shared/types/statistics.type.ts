export interface IAdminDashboard {
  // 1. Chỉ số Tổng quan (Overview Cards)
  overview: {
    totalRevenue: number;    // Tổng doanh thu (Order DELIVERED)
    totalCost: number;       // Tổng chi phí nhập hàng (ImportRequest COMPLETED)
    grossProfit: number;     // Lợi nhuận gộp (Doanh thu - Chi phí)
    totalPayroll: number;    // Tổng quỹ lương đã trả
  };

  // 2. Tình trạng Đơn hàng (Pie Chart)
  orderStats: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };

  // 3. Top Sản phẩm bán chạy (Bar Chart)
  topProducts: Array<{
    productName: string;
    sku: string;
    totalSold: number;
    revenue: number;
  }>;

  // 4. Báo động Kho (Data Table nhỏ)
  lowStockAlerts: number; // Số lượng SP sắp hết hàng
}

export type DashboardFilterDto ={
    fromDate?: string; // VD: 2026-02-01
    toDate?: string;   // VD: 2026-02-28
}