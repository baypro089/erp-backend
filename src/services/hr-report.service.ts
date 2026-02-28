import { ManagerReportFilterDTO } from "@/dtos/manager-report-filter.dto";
import { Employee } from "@/entities/employee.entity";
import { Payslip } from "@/entities/payslip.entity";
import { ResignationRequest } from "@/entities/resignation-request.entity";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { ResignationStatus } from "@libs/shared/enums/resignation-status.enum";

@Injectable()
export class HrReportService {
  constructor(private dataSource: DataSource) {}

  async getManagerReport(filter: ManagerReportFilterDTO) {
    const { month, year } = filter;
    
    // Nếu không truyền năm, mặc định lấy năm hiện tại
    const targetYear = year || new Date().getFullYear();

    // ==========================================
    // 1. THỐNG KÊ TÌNH HÌNH NHÂN SỰ (HEADCOUNT)
    // ==========================================
    const empRepo = this.dataSource.getRepository(Employee);
    
    // 1.1. Tổng nhân sự đang hoạt động (totalActive)
    const totalActive = await empRepo.count({
      where: [
        { status: Status.ACTIVE },
        { status: Status.PROBATION }
      ]
    });

    // 1.2. Số người mới tuyển trong kỳ (newHires)
    let newHiresQuery = empRepo.createQueryBuilder('e')
      .select(`TO_CHAR(e.createdAt, 'YYYY-MM')`, 'month')
      .addSelect('COUNT(e.id)', 'count')
      .where(`EXTRACT(YEAR FROM e.createdAt) = :year`, { year: targetYear })
      .groupBy(`TO_CHAR(e.createdAt, 'YYYY-MM')`)
      .orderBy('month', 'ASC');

    if (month) {
      newHiresQuery = newHiresQuery.andWhere(`EXTRACT(MONTH FROM e.createdAt) = :month`, { month });
    }

    const newHiresData = await newHiresQuery.getRawMany();

    // 1.3. Số người nghỉ việc (resigned) - tính theo approvedLastDay trong ResignationRequest
    const resignRepo = this.dataSource.getRepository(ResignationRequest);
    
    let resignedQuery = resignRepo.createQueryBuilder('r')
      .select(`TO_CHAR(r.approvedLastDay, 'YYYY-MM')`, 'month')
      .addSelect('COUNT(r.id)', 'count')
      .where(`EXTRACT(YEAR FROM r.approvedLastDay) = :year`, { year: targetYear })
      .andWhere('r.status IN (:...statuses)', { 
        statuses: [ResignationStatus.COMPLETED, ResignationStatus.APPROVED] 
      })
      .groupBy(`TO_CHAR(r.approvedLastDay, 'YYYY-MM')`)
      .orderBy('month', 'ASC');

    if (month) {
      resignedQuery = resignedQuery.andWhere(`EXTRACT(MONTH FROM r.approvedLastDay) = :month`, { month });
    }

    const resignedData = await resignedQuery.getRawMany();

    // ==========================================
    // 2. THỐNG KÊ LƯƠNG, THƯỞNG (PAYROLL)
    // ==========================================
    const payslipRepo = this.dataSource.getRepository(Payslip);
    
    // Query tổng hợp quỹ lương theo phòng ban
    let payrollQuery = payslipRepo.createQueryBuilder('p')
      .leftJoin('p.employee', 'emp')
      .leftJoin('emp.department', 'dept')
      .select('dept.id', 'departmentId')
      .addSelect('dept.name', 'department')
      .addSelect('SUM(CAST(p.baseSalary AS DECIMAL))', 'totalBaseSalary')
      .addSelect(`SUM(CAST(COALESCE(p.details->>'allowance', '0') AS DECIMAL))`, 'totalAllowance')
      .addSelect(`SUM(CAST(COALESCE(p.details->>'bonus', '0') AS DECIMAL))`, 'totalBonus')
      .addSelect('SUM(CAST(p.finalSalary AS DECIMAL))', 'totalFinalSalary')
      .where('p.year = :year', { year: targetYear });

    if (month) {
      payrollQuery = payrollQuery.andWhere('p.month = :month', { month });
    }

    const payrollData = await payrollQuery
      .groupBy('dept.id')
      .addGroupBy('dept.name')
      .getRawMany();

    // ==========================================
    // 3. CHI TIẾT BẢNG LƯƠNG (Để xuất Excel)
    // ==========================================
    let detailsQuery = payslipRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.employee', 'emp')
      .leftJoinAndSelect('emp.department', 'dept')
      .leftJoinAndSelect('emp.currentPosition', 'pos')
      .where('p.year = :year', { year: targetYear });

    if (month) {
      detailsQuery = detailsQuery.andWhere('p.month = :month', { month });
    }

    const details = await detailsQuery
      .orderBy('dept.name', 'ASC')
      .addOrderBy('emp.fullName', 'ASC')
      .getMany();

    return {
      period: month ? `Tháng ${month}/${targetYear}` : `Năm ${targetYear}`,
      headcount: {
        totalActive,
        newHires: newHiresData,
        resigned: resignedData
      },
      payrollSummary: payrollData,
      payrollDetails: details
    };
  }
}