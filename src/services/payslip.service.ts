import { LeaveRequest } from "@/entities/leave-request.entity";
import { Payslip } from "@/entities/payslip.entity";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { PayslipRepository } from "@/repositories/payslip.repository";
import { LeaveRequestStatus, LeaveRequestType } from "@libs/shared/enums/leave-request-status.enum";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, In, LessThanOrEqual } from "typeorm";
import { RedisService } from "./redis.service";
import { PayrollGenerationResult, PayrollItemResult } from "@libs/shared/types/payslips.type";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { Employee } from "@/entities/employee.entity";
import { ResignationRequest } from "@/entities/resignation-request.entity";
import { ResignationStatus } from "@libs/shared/enums/resignation-status.enum";
import { SystemSetting } from "@/entities/system-setting";
import { JobHistory } from "@/entities/job-history.entity";
import { Holiday } from "@/entities/holiday.entity";
import { getStandardWorkDays } from "@/utils/date.util";

const SETTING_KEYS = {
    LUNCH: 'GLOBAL_LUNCH_AMOUNT',
    TRANSPORT: 'GLOBAL_TRANSPORT_AMOUNT',
    BHXH_RATE: 'INSURANCE_RATE_PERCENT',
};

const COMPONENT_KEYS = {
    LUNCH: 'LUNCH',          // Khớp với code trong bảng SalaryComponent
    TRANSPORT: 'TRANSPORT',  // Khớp với code trong bảng SalaryComponent
    BHXH: 'BHXH',
};

@Injectable()
export class PayslipService {
    constructor(
        private readonly payslipRepository: PayslipRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    // Hàm tính lương cho 1 nhân viên
    async calculatePayslip(employeeId: string, month: number, year: number): Promise<Payslip> {
        return this.dataSource.transaction(async (manager) => {

            // Lấy danh sách ngày lễ từ database
            const holidayRepo = manager.getRepository(Holiday);
            const dbHolidays = await holidayRepo.find();
            const holidayStrings = dbHolidays
                .map(h => {
                    const date = new Date(h.date);
                    return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
                });
            const STANDARD_WORK_DAYS = getStandardWorkDays(month, year, holidayStrings, true);
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
            const employeeRepo = manager.getRepository(Employee);
            const employee = await employeeRepo.findOne({
                where: { id: employeeId, status: In([Status.ACTIVE, Status.MATERNITY_LEAVE, Status.PROBATION]) }
            });
            if (!employee) throw new NotFoundException('Nhân viên không tồn tại');

            // 3. Lấy mức lương hiện tại (Từ JobHistory mới nhất đang active)
            const jobHistoryRepo = manager.getRepository(JobHistory);
            const currentJob = await jobHistoryRepo.findOne({
                where: { employee: { id: employeeId }, isCurrent: true }
            });

            // Fallback: Nếu không có job history thì lấy lương tạm từ bảng Employee (nếu bạn có lưu)
            // Hoặc throw error bắt buộc phải có JobHistory
            const baseSalary = currentJob ? Number(currentJob.salaryAtTime) : 0;

            // CASE ĐẶC BIỆT: Nghỉ thai sản
            if (employee.status === Status.MATERNITY_LEAVE) {
                // Tạo phiếu lương 0 đồng
                const payslip = payslipRepo.create({
                    employee,
                    month, year,
                    standardWorkDays: STANDARD_WORK_DAYS,
                    baseSalary: baseSalary,
                    actualWorkDays: 0,
                    finalSalary: 0,
                    details: {},
                    note: 'Nhân viên nghỉ thai sản (Lương do BHXH chi trả)',
                    isPaid: true // Coi như xong
                });
                return payslipRepo.save(payslip);
            }

            // 4. Kiểm tra ResignationRequest APPROVED
            const resignationRepo = manager.getRepository(ResignationRequest);
            const approvedResignation = await resignationRepo.findOne({
                where: {
                    employee: { id: employeeId },
                    status: ResignationStatus.APPROVED
                }
            });

            // Tính ngày cuối cùng làm việc trong tháng (nếu có đơn nghỉ việc)
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0);
            let effectiveLastDay = endOfMonth; // Mặc định là ngày cuối tháng
            let isResigningThisMonth = false;

            if (approvedResignation && approvedResignation.approvedLastDay) {
                const lastDay = new Date(approvedResignation.approvedLastDay);

                // Kiểm tra nếu ngày nghỉ việc nằm trong tháng hiện tại
                if (lastDay >= startOfMonth && lastDay <= endOfMonth) {
                    effectiveLastDay = lastDay;
                    isResigningThisMonth = true;
                }
            }

            // 5. Tính số ngày nghỉ KHÔNG LƯƠNG trong tháng
            // Logic: Query các đơn APPROVED, Type != ANNUAL, nằm trong tháng
            // (Đây là logic đơn giản hóa, thực tế phải tính giao nhau giữa khoảng ngày nghỉ và tháng)
            const unpaidLeaves = await this.getUnpaidLeaveDays(employeeId, month, year, manager);

            // 6. Tính toán số ngày làm việc thực tế
            let actualWorkDays: number;

            if (isResigningThisMonth) {
                // Tính số ngày từ đầu tháng đến ngày nghỉ việc
                const dayOfMonth = effectiveLastDay.getDate();
                // Giả sử tỷ lệ ngày làm việc/ngày trong tháng = 26/30
                actualWorkDays = Math.round((dayOfMonth / endOfMonth.getDate()) * STANDARD_WORK_DAYS);
                // Trừ đi số ngày nghỉ không lương
                actualWorkDays -= unpaidLeaves;
            } else {
                // Trường hợp bình thường
                actualWorkDays = STANDARD_WORK_DAYS - unpaidLeaves;
            }

            // Đảm bảo actualWorkDays không âm
            actualWorkDays = Math.max(0, actualWorkDays);

            const salaryPerDay = baseSalary / STANDARD_WORK_DAYS;
            let finalSalary = salaryPerDay * actualWorkDays;

            // Cộng thêm phụ cấp/thưởng - Trừ đi các khoản khác
            const settings = await manager.getRepository(SystemSetting).find({ where: { isActive: true } });

            const settingMap = new Map(settings.map(s => [s.key, Number(s.value)]));

            // Tính tỷ lệ cho phụ cấp (nếu nghỉ việc giữa tháng hoặc nghỉ không lương nhiều)
            const allowanceRatio = actualWorkDays / STANDARD_WORK_DAYS;

            // A. Khoản ăn trưa (tính theo tỷ lệ ngày làm việc)
            const lunchAmount = (settingMap.get(SETTING_KEYS.LUNCH) || 0) * allowanceRatio;

            // B. Khoản đi lại (tính theo tỷ lệ ngày làm việc)
            const transportAmount = (settingMap.get(SETTING_KEYS.TRANSPORT) || 0) * allowanceRatio;

            // C. Bảo hiểm xã hội (BHXH - tính trên lương thực tế)
            const bhxhRate = settingMap.get(SETTING_KEYS.BHXH_RATE) || 0;
            const actualSalary = salaryPerDay * actualWorkDays;
            const bhxhAmount = actualSalary * bhxhRate;

            // 7. Quyết toán phép năm (nếu nhân viên nghỉ việc trong tháng này)
            let annualLeaveSettlement = 0;
            if (isResigningThisMonth && employee.remainingLeave > 0) {
                annualLeaveSettlement = salaryPerDay * employee.remainingLeave;
                finalSalary += annualLeaveSettlement;
            }

            // Đóng gói vào details
            const details = {
                [COMPONENT_KEYS.LUNCH]: Math.round(lunchAmount * 100) / 100,
                [COMPONENT_KEYS.TRANSPORT]: Math.round(transportAmount * 100) / 100,
                [COMPONENT_KEYS.BHXH]: Math.round(bhxhAmount * 100) / 100,
                annualLeaveSettlement: Math.round(annualLeaveSettlement * 100) / 100
            };

            // Tính tổng phụ cấp và trừ BHXH
            const allowance = lunchAmount + transportAmount;
            const deduction = bhxhAmount;
            finalSalary = finalSalary + allowance - deduction;

            // 8. Lưu/Cập nhật vào DB
            // Nếu chưa có thì tạo mới, có rồi (nhưng chưa pay) thì update
            let result: Payslip;
            const note = isResigningThisMonth
                ? `Nghỉ việc ngày ${effectiveLastDay.toLocaleDateString('vi-VN')}${annualLeaveSettlement > 0 ? ` - Quyết toán ${employee.remainingLeave} ngày phép: ${annualLeaveSettlement.toLocaleString('vi-VN')}đ` : ''}`
                : undefined;

            if (existing) {
                existing.baseSalary = baseSalary;
                existing.standardWorkDays = STANDARD_WORK_DAYS;
                existing.actualWorkDays = actualWorkDays;
                existing.unpaidLeaveDays = unpaidLeaves;
                existing.details = details;
                existing.finalSalary = Math.round(finalSalary * 100) / 100; // Làm tròn 2 chữ số thập phân
                existing.isPaid = false;
                if (note) existing.note = note;
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
                    details,
                    finalSalary: Math.round(finalSalary * 100) / 100, // Làm tròn 2 chữ số thập phân
                    isPaid: false,
                    note
                });
                result = await payslipRepo.save(newPayslip);
            }

            // Clear cache
            await this.redisService.delByPrefix('payslips:all:');
            await this.redisService.delByPrefix('unpaid_leaves:');
            await this.redisService.delByPrefix('my_payslips:');
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
        const employees = await this.employeeRepository.find({ where: { status: In([Status.ACTIVE, Status.MATERNITY_LEAVE, Status.PROBATION]) } });
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

        // Clear cache
        await this.redisService.delByPrefix('payslips:all:');
        await this.redisService.delByPrefix('unpaid_leaves:');
        await this.redisService.delByPrefix('my_payslips:');

        return {
            month,
            year,
            totalEmployees: employees.length,
            successCount,
            failedCount,
            items
        };
    }

    async findAllPayslips(
        month?: number,
        year?: number,
        page?: number,
        pageSize?: number
    ): Promise<{ items: Payslip[], total: number }> {
        const cacheKey = `payslips:all:${month || 'all'}:${year || 'all'}:${page || 'all'}:${pageSize || 'all'}`;

        const cached = await this.redisService.get<{ items: Payslip[], total: number }>(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.payslipRepository.findAllPayslipsFilteredAndPaged(month, year, page, pageSize);
        await this.redisService.set(cacheKey, result, 3600);
        return result;
    }

    async markPayslipAsPaid(payslipId: string): Promise<Payslip> {
        const payslip = await this.payslipRepository.findOne({
            where: { id: payslipId },
            relations: ['employee']
        });
        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }
        payslip.isPaid = true;
        const result = await this.payslipRepository.save(payslip);
        const { employeeId, month, year } = payslip;

        // Clear cache
        await this.redisService.delByPrefix('payslips:all:');
        await this.redisService.delByPrefix('unpaid_leaves:');
        await this.redisService.delByPrefix('my_payslips:');
        return result;
    }

    async getMyPayslips(
        employeeId: string,
        month?: number,
        year?: number,
        page?: number,
        pageSize?: number
    ): Promise<{ items: Payslip[], total: number }> {
        const cacheKey = `my_payslips:${employeeId}:${month || 'all'}:${year || 'all'}:${page || 'all'}:${pageSize || 'all'}`;
        const cached = await this.redisService.get<{ items: Payslip[], total: number }>(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.payslipRepository.findAllPayslipsFilteredAndPaged(month, year, page, pageSize, employeeId);
        // Lọc chỉ lấy payslip của employeeId
        result.items = result.items.filter(p => p.employee.id === employeeId);
        await this.redisService.set(cacheKey, result, 3600);
        return result;
    }

    async getPayslipById(payslipId: string): Promise<Payslip> {
        const payslip = await this.payslipRepository.findOne({
            where: { id: payslipId },
            relations: ['employee', 'employee.department', 'employee.currentPosition']
        });
        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }
        return payslip;
    }
}