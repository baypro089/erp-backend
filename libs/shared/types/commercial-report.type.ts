import { ReportPeriod } from "@libs/shared/enums/report-period.enum";

export interface ICommercialReport {
    periodInfo: PeriodInfo; // Thông tin về kỳ báo cáo (ví dụ: "Tháng 1/2024", "Quý 1/2024", "Năm 2024")
    financials: FinancialData; // Dữ liệu tài chính
    exportedDetails: ExportedDetails[]; // Dữ liệu chi tiết đã được xuất ra
}

export interface PeriodInfo {
    type: ReportPeriod | undefined; // Loại kỳ báo cáo (MONTH, QUARTER, YEAR)
    year: number; // Năm của kỳ báo cáo
    value: any; // Giá trị của kỳ báo cáo (tháng hoặc quý hoặc tất cả năm)
}

export interface FinancialData {
    revenue: number; // Doanh thu
    cogs: number; // Giá vốn hàng bán
    grossProfit: number; // Lợi nhuận gộp
    profitMargin: any; // tỉ suất lợi nhuận gộp (kiểu any vì có thể là số hoặc chuỗi để hiển thị phần trăm)
}

export interface ExportedDetails {
    sku: string; // Mã sản phẩm
    productName: string; // Tên sản phẩm
    totalExportedQuantity: number; // Tổng số lượng đã xuất ra
    revenue: number; // Doanh thu từ sản phẩm này
}

export interface SalesReportFilterDto{
    periodType?: ReportPeriod; // Loại kỳ báo cáo (MONTH, QUARTER, YEAR)
    month?: number; // Tháng (nếu periodType là MONTH)
    quarter?: number; // Quý (nếu periodType là QUARTER)
    year?: number; // Năm (áp dụng cho tất cả các loại kỳ báo cáo)
}