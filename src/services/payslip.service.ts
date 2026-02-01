import { LeaveRequest } from "@/entities/leave-request.entity";
import { Payslip } from "@/entities/payslip.entity";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { JobHistoryRepository } from "@/repositories/job-history.repository";
import { PayslipRepository } from "@/repositories/payslip.repository";
import { LeaveRequestStatus, LeaveRequestType } from "@libs/shared/enums/leave-request-status.enum";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";
import { createHash } from "crypto";
import { PayrollGenerationResult, PayrollItemResult } from "@libs/shared/types/payslips.type";

@Injectable()
export class PayslipService {
    constructor(
        private readonly payslipRepository: PayslipRepository,
        private readonly jobHistoryRepository: JobHistoryRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    // Hàm tính lương cho 1 nhân viên
    async calculatePayslip(employeeId: string, month: number, year: number): Promise<Payslip> {
        return this.dataSource.transaction(async (manager) => {
            const STANDARD_WORK_DAYS = 26; // Giả định công chuẩn
            const payslipRepo = manager.getRepository(Payslip);

            // 1. Kiểm tra xem đã chốt lương tháng này chưa
            const existing = await payslipRepo.findOne({
                where: { employee: { id: employeeId }, month, year },
                relations: ['employee']
            });
            if (existing && existing.isPaid) {
                throw new BadRequestException('Lương tháng này đã được thanh toán, không thể tính lại!');
            }

            // 2. Lấy thông tin nhân viên
            const employeeRepo = manager.getRepository('Employee');
            const employee = await employeeRepo.findOne({ where: { id: employeeId } });
            if (!employee) throw new NotFoundException('Nhân viên không tồn tại');

            // 3. Lấy mức lương hiện tại (Từ JobHistory mới nhất đang active)
            const jobHistoryRepo = manager.getRepository('JobHistory');
            const currentJob = await jobHistoryRepo.findOne({
                where: { employee: { id: employeeId }, isCurrent: true }
            });
            // Fallback: Nếu không có job history thì lấy lương tạm từ bảng Employee (nếu bạn có lưu)
            // Hoặc throw error bắt buộc phải có JobHistory
            const baseSalary = currentJob ? Number(currentJob.salaryAtTime) : 0;

            // 4. Tính số ngày nghỉ KHÔNG LƯƠNG trong tháng
            // Logic: Query các đơn APPROVED, Type != ANNUAL, nằm trong tháng
            // (Đây là logic đơn giản hóa, thực tế phải tính giao nhau giữa khoảng ngày nghỉ và tháng)
            const unpaidLeaves = await this.getUnpaidLeaveDays(employeeId, month, year, manager);

            // 5. Tính toán
            const actualWorkDays = STANDARD_WORK_DAYS - unpaidLeaves;
            const salaryPerDay = baseSalary / STANDARD_WORK_DAYS;
            let finalSalary = salaryPerDay * actualWorkDays;

            // Cộng thêm phụ cấp/thưởng (Mockup data - sau này có thể lấy từ bảng khác)
            const bonus = 0;
            const allowance = 0;
            finalSalary += bonus + allowance;

            // 6. Lưu/Cập nhật vào DB
            // Nếu chưa có thì tạo mới, có rồi (nhưng chưa pay) thì update
            let result: Payslip;
            if (existing) {
                existing.baseSalary = baseSalary;
                existing.standardWorkDays = STANDARD_WORK_DAYS;
                existing.actualWorkDays = actualWorkDays;
                existing.unpaidLeaveDays = unpaidLeaves;
                existing.details = { bonus, allowance, deduction: 0 };
                existing.finalSalary = Math.round(finalSalary * 100) / 100; // Làm tròn 2 chữ số thập phân
                existing.isPaid = false;
                result = await payslipRepo.save(existing);
            } else {
                const newPayslip = payslipRepo.create({
                    employee,
                    month,
                    year,
                    baseSalary,
                    standardWorkDays: STANDARD_WORK_DAYS,
                    actualWorkDays,
                    unpaidLeaveDays: unpaidLeaves,
                    details: { bonus, allowance, deduction: 0 },
                    finalSalary: Math.round(finalSalary * 100) / 100, // Làm tròn 2 chữ số thập phân
                    isPaid: false
                });
                result = await payslipRepo.save(newPayslip);
            }

            // Clear cache
            await this.redisService.delByPrefix(`payslips:${employeeId}:`);
            await this.redisService.delByPrefix('payslips:all:');

            return result;
        });
    }

    // Helper: Tính ngày nghỉ không lương
    private async getUnpaidLeaveDays(empId: string, month: number, year: number, manager?: any): Promise<number> {
        const cacheKey = `unpaid_leaves:${empId}:${year}-${month}`;
        const cached = await this.redisService.get<number>(cacheKey);
        if (cached !== null) {
            return cached;
        }

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const leaveRepo = manager ? manager.getRepository(LeaveRequest) : this.dataSource.getRepository(LeaveRequest);
        const leaves = await leaveRepo.createQueryBuilder('leave_requests')
            .where('leave_requests.employee_id = :empId', { empId })
            .andWhere('leave_requests.status = :status', { status: LeaveRequestStatus.APPROVED })
            .andWhere('leave_requests.type IN (:...types)', { types: [LeaveRequestType.UNPAID, LeaveRequestType.SICK] }) // Nghỉ ốm và ko lương đều trừ (ví dụ)
            .andWhere('leave_requests.startDate <= :endOfMonth', { endOfMonth })
            .andWhere('leave_requests.endDate >= :startOfMonth', { startOfMonth })
            .getMany();

        let totalDays = 0;
        for (const leave of leaves) {
            // Logic tính giao nhau (Intersection) giữa khoảng nghỉ và tháng hiện tại
            // Code này đảm bảo nếu nghỉ từ 28/1 đến 2/2 thì tháng 1 chỉ tính 28,29,30,31
            const start = leave.startDate < startOfMonth ? startOfMonth : leave.startDate;
            const end = leave.endDate > endOfMonth ? endOfMonth : leave.endDate;

            // Công thức tính số ngày + 1
            const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            totalDays += days;
        }

        // Cache for 1 hour
        await this.redisService.set(cacheKey, totalDays, 3600);
        return totalDays;
    }

    // Chạy tính lương cho toàn bộ nhân viên (Batch Job)
    async generatePayrollForMonth(month: number, year: number): Promise<PayrollGenerationResult> {
        const employees = await this.employeeRepository.find();
        const items: PayrollItemResult[] = [];
        let successCount = 0;
        let failedCount = 0;

        for (const emp of employees) {
            try {
                const slip = await this.calculatePayslip(emp.id, month, year);
                items.push({
                    employeeId: emp.id,
                    employeeName: emp.fullName,
                    status: 'SUCCESS',
                    payslipId: slip.id
                });
                successCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                items.push({
                    employeeId: emp.id,
                    employeeName: emp.fullName,
                    status: 'FAILED',
                    error: errorMessage
                });
                failedCount++;
            }
        }

        return {
            month,
            year,
            totalEmployees: employees.length,
            successCount,
            failedCount,
            items
        };
    }
}