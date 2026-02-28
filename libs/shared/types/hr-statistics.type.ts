export interface IHrDashboard {
  // 1. Chỉ số nhân sự cơ bản
  headcount: {
    totalActive: number;     // Tổng nhân sự đang làm việc
    newHires: number;        // Số người mới tuyển trong tháng
    resigned: number;        // Số người nghỉ việc trong tháng
  };

  // 2. Tình hình Nghỉ phép / Chấm công
  attendance: {
    onLeaveToday: number;    // Số người đang nghỉ phép HÔM NAY
    pendingRequests: number; // Đơn xin nghỉ phép đang chờ duyệt
  };

  // 3. Quỹ lương (Payroll)
  payroll: {
    totalEstimated: number;  // Ước tính quỹ lương tháng này
    totalPaid: number;       // Đã thanh toán (Chốt)
  };

  // 4. Cơ cấu nhân sự theo phòng ban (Pie Chart)
  departmentDistribution: Array<{
    departmentName: string;
    count: number;
  }>;
}

export type HrDashboardFilterDto ={
    month?: string; // VD: 2026-02
}