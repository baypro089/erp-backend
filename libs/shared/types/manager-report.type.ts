import { PayslipResponse } from "./payslips.type";

export interface IManagerReport {
  // Kỳ báo cáo (VD: "Tháng 2/2026" hoặc "Năm 2026")
  period: string;

  // 1. Thống kê nhân sự
  headcount: {
    totalActive: number; // Tổng số nhân viên đang hoạt động
    newHires: IMonthlyCount[]; // Số người tuyển mới theo tháng
    resigned: IMonthlyCount[]; // Số người nghỉ việc theo tháng
  };

  // 2. Tổng hợp quỹ lương theo phòng ban
  payrollSummary: IPayrollSummary[];

  // 3. Chi tiết bảng lương từng nhân viên (dùng để xuất Excel)
  payrollDetails: PayslipResponse[];
}

export interface IMonthlyCount {
  month: string; // Format: YYYY-MM (VD: "2026-02")
  count: string; // COUNT trả về string từ PostgreSQL
}

export interface IPayrollSummary {
  departmentId: string;
  department: string; // Tên phòng ban
  totalBaseSalary: string; // Tổng lương cứng (SUM trả về string)
  totalAllowance: string; // Tổng phụ cấp
  totalBonus: string; // Tổng thưởng
  totalFinalSalary: string; // Tổng lương thực nhận
}

export type ManagerReportFilterDto = {
  month?: number; // Tháng (1-12)
  year?: number; // Năm (VD: 2026)
};