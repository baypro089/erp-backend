import { HrDashboardFilterDTO } from "@/dtos/hr-dashboard-filter.dto";
import { Employee } from "@/entities/employee.entity";
import { LeaveRequest } from "@/entities/leave-request.entity";
import { Payslip } from "@/entities/payslip.entity";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { LeaveRequestStatus } from "@libs/shared/enums/leave-request-status.enum";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";


@Injectable()
export class HrStatisticService {
  constructor(private dataSource: DataSource) {}

  async getDashboard(filter: HrDashboardFilterDTO) {
    const today = new Date();
    // Xử lý filter tháng (VD: '2026-02')
    const targetMonth = filter.month ? new Date(`${filter.month}-01`) : new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Tìm ngày đầu tháng và cuối tháng
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

    const empRepo = this.dataSource.getRepository(Employee);

    // 1. HEADCOUNT (Sĩ số)
    const totalActive = await empRepo.count({ where: { status: Status.ACTIVE } });
    
    const newHires = await empRepo.createQueryBuilder('e')
      .where('e.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth })
      .getCount();

    // Giả sử có lưu trường resignationDate khi nhân viên nghỉ việc
    const resigned = await empRepo.createQueryBuilder('e')
      .where('e.status = :status', { status: Status.RESIGNED })
      .andWhere('e.updatedAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth }) // Tạm dùng updatedAt
      .getCount();

    // 2. ATTENDANCE & LEAVE (Nghỉ phép)
    // Ai đang nghỉ hôm nay? (Start date <= today <= End date)
    const todayStr = today.toISOString().split('T')[0];
    const onLeaveToday = await this.dataSource.getRepository(LeaveRequest)
      .createQueryBuilder('l')
      .where('l.status = :status', { status: LeaveRequestStatus.APPROVED })
      .andWhere(':today BETWEEN l.startDate AND l.endDate', { today: todayStr })
      .getCount();

    const pendingRequests = await this.dataSource.getRepository(LeaveRequest)
      .count({ where: { status: LeaveRequestStatus.PENDING } });

    // 3. PAYROLL (Quỹ lương)
    const payrollQuery = await this.dataSource.getRepository(Payslip)
      .createQueryBuilder('p')
      .select('SUM(p.finalSalary)', 'total')
      .addSelect('p.isPaid', 'isPaid')
      .where('p.month = :month', { month: targetMonth.getMonth() + 1 })
      .andWhere('p.year = :year', { year: targetMonth.getFullYear() })
      .groupBy('p.isPaid')
      .getRawMany();

    let totalEstimated = 0;
    let totalPaid = 0;
    payrollQuery.forEach(row => {
      if (row.isPaid) totalPaid += Number(row.total);
      else totalEstimated += Number(row.total);
    });
    totalEstimated += totalPaid; // Ước tính = Đã trả + Chưa trả

    // 4. DEPARTMENT DISTRIBUTION (Phân bổ phòng ban)
    const departmentDistribution = await empRepo.createQueryBuilder('e')
      .leftJoin('e.department', 'dept')
      .select('dept.name', 'departmentName')
      .addSelect('COUNT(e.id)', 'count')
      .where('e.status = :status', { status: Status.ACTIVE })
      .groupBy('dept.id')
      .getRawMany();

    return {
      headcount: { totalActive, newHires, resigned },
      attendance: { onLeaveToday, pendingRequests },
      payroll: { totalEstimated, totalPaid },
      departmentDistribution: departmentDistribution.map(d => ({
        departmentName: d.departmentName || 'Chưa phân bổ',
        count: Number(d.count)
      }))
    };
  }
}