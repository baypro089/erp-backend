export interface IWarehouseReport {
  // Kỳ báo cáo (VD: "Tháng 2/2026")
  period: string;
  
  // Kho (VD: "Tất cả các kho" hoặc tên kho cụ thể)
  warehouse: string;
  
  // Dữ liệu sản phẩm
  data: IProductStatistics[];
}

export interface IProductStatistics {
  sku: string; // Mã SKU sản phẩm
  productName: string; // Tên sản phẩm
  hasSerialNumber: boolean; // Có quản lý Serial không
  totalImported: number; // Tổng nhập trong kỳ
  totalExported: number; // Tổng xuất trong kỳ (bao gồm xuất bán + chuyển kho)
  currentStock: number; // Tồn kho hiện tại
}

export type WarehouseReportFilterDto = {
  warehouseId?: string; // UUID của kho, nếu không truyền thì tính tổng tất cả các kho
  month?: number; // Tháng (1-12)
  year?: number; // Năm (VD: 2026)
};
