import { LeaveRequest } from "@/entities/leave-request.entity";
import { Payslip } from "@/entities/payslip.entity";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { PayslipRepository } from "@/repositories/payslip.repository";
import { LeaveRequestStatus, LeaveRequestType } from "@libs/shared/enums/leave-request-status.enum";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { RedisService } from "./redis.service";
import { PayrollGenerationResult, PayrollItemResult } from "@libs/shared/types/payslips.type";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { Employee } from "@/entities/employee.entity";
import { ResignationRequest } from "@/entities/resignation-request.entity";
import { ResignationStatus } from "@libs/shared/enums/resignation-status.enum";
import { TerminationRequest } from "@/entities/termination-request.entity";
import { TerminationStatus } from "@libs/shared/enums/termination-status.enum";
import { SystemSetting } from "@/entities/system-setting";
import { JobHistory } from "@/entities/job-history.entity";
import { Holiday } from "@/entities/holiday.entity";
import { calculateWorkingDays, getStandardWorkDays } from "@/utils/date.util";
import { TaxCalculator } from "@/utils/tax-calculator.util";
import { User } from "@/entities/user.entity";
import { Department } from "@/entities/department.entity";
import { PORTAL_PERMISSIONS } from "@libs/shared/constants/portal-permissions.constant";
import { EMPLOYEE_PERMISSIONS } from "@libs/shared/constants/permissions.constant";
import { createHash } from "crypto";

const SETTING_KEYS = {
    LUNCH: 'GLOBAL_LUNCH_AMOUNT',
    TRANSPORT: 'GLOBAL_TRANSPORT_AMOUNT',
    BASE_SALARY: 'BASE_SALARY',
    BHXH_RATE: 'INSURANCE_RATE_PERCENT',
    BHYT_RATE: 'HEALTH_INSURANCE_RATE_PERCENT',
    BHTN_RATE: 'UNEMPLOYMENT_INSURANCE_RATE_PERCENT',
};

const COMPONENT_KEYS = {
    LUNCH: 'LUNCH',          // Khớp với code trong bảng SalaryComponent
    TRANSPORT: 'TRANSPORT',  // Khớp với code trong bảng SalaryComponent
    BHXH: 'BHXH',
    BHYT: 'BHYT',
    BHTN: 'BHTN',
    PIT: 'PIT',
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
    async calculatePayslip(employeeId: string, month: number, year: number, manager?: EntityManager): Promise<Payslip> {
        const calculate = async (txManager: EntityManager): Promise<Payslip> => {

            // Lấy danh sách ngày lễ từ database
            const holidayRepo = txManager.getRepository(Holiday);
            const dbHolidays = await holidayRepo.find();
            const holidayStrings = dbHolidays
                .map(h => {
                    const date = new Date(h.date);
                    return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
                });
            const STANDARD_WORK_DAYS = getStandardWorkDays(month, year, holidayStrings, true);
            const payslipRepo = txManager.getRepository(Payslip);

            // 1. Kiểm tra xem đã chốt lương tháng này chưa
            const existing = await payslipRepo.findOne({
                where: { employee: { id: employeeId }, month, year },
                relations: ['employee']
            });
            if (existing && existing.isPaid) {
                throw new BadRequestException('Lương tháng này đã được thanh toán, không thể tính lại!');
            }

            // 2. Lấy thông tin nhân viên
            const employeeRepo = txManager.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { id: employeeId } });
            if (!employee) throw new NotFoundException('Nhân viên không tồn tại');

            // 3. Lấy mức lương hiện tại (Từ JobHistory mới nhất đang active)
            const jobHistoryRepo = txManager.getRepository(JobHistory);
            const currentJob = await jobHistoryRepo.findOne({
                where: { employee: { id: employeeId }, isCurrent: true }
            });

            // Fallback: Nếu không có job history thì lấy lương tạm từ bảng Employee (nếu bạn có lưu)
            // Hoặc throw error bắt buộc phải có JobHistory
            if (!currentJob) {
                throw new BadRequestException(`Nhân viên ${employee.fullName} chưa có lịch sử công việc, không thể tính lương!`);
            }
            const baseSalary = Number(currentJob.salaryAtTime);

            // CASE ĐẶC BIỆT: Nghỉ thai sản
            if (employee.status === Status.MATERNITY_LEAVE) {
                // BUG FIX: Phải update existing thay vì tạo mới để tránh duplicate constraint
                if (existing) {
                    existing.standardWorkDays = STANDARD_WORK_DAYS;
                    existing.baseSalary = baseSalary;
                    existing.actualWorkDays = 0;
                    existing.finalSalary = 0;
                    existing.details = {};
                    existing.note = 'Nhân viên nghỉ thai sản (Lương do BHXH chi trả)';
                    existing.isPaid = true;
                    return payslipRepo.save(existing);
                }
                const payslip = payslipRepo.create({
                    employee,
                    month, year,
                    standardWorkDays: STANDARD_WORK_DAYS,
                    baseSalary,
                    actualWorkDays: 0,
                    finalSalary: 0,
                    details: {},
                    note: 'Nhân viên nghỉ thai sản (Lương do BHXH chi trả)',
                    isPaid: true
                });
                return payslipRepo.save(payslip);
            }

            // 4. Kiểm tra request nghỉ việc/sa thải đã duyệt
            const resignationRepo = txManager.getRepository(ResignationRequest);
            const terminationRepo = txManager.getRepository(TerminationRequest);

            const approvedResignation = await resignationRepo.findOne({
                where: {
                    employee: { id: employeeId },
                    status: ResignationStatus.APPROVED
                }
            });

            const approvedTermination = await terminationRepo.findOne({
                where: {
                    employee: { id: employeeId },
                    status: TerminationStatus.APPROVED,
                },
                order: { terminationDate: 'DESC' },
            });

            // Tính ngày cuối cùng làm việc trong tháng (nếu có request nghỉ việc/sa thải)
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0);
            let effectiveLastDay = endOfMonth; // Mặc định là ngày cuối tháng
            let isSeparatedThisMonth = false;
            let separationReason: 'RESIGNATION' | 'TERMINATION' | null = null;

            if (approvedResignation && approvedResignation.approvedLastDay) {
                const lastDay = new Date(approvedResignation.approvedLastDay);

                // Kiểm tra nếu ngày nghỉ việc nằm trong tháng hiện tại
                if (lastDay >= startOfMonth && lastDay <= endOfMonth) {
                    effectiveLastDay = lastDay;
                    isSeparatedThisMonth = true;
                    separationReason = 'RESIGNATION';
                }
            }

            if (approvedTermination && approvedTermination.terminationDate) {
                const terminateDay = new Date(approvedTermination.terminationDate);

                if (terminateDay >= startOfMonth && terminateDay <= endOfMonth) {
                    // Nếu trong tháng vừa có resignation vừa có termination thì ưu tiên ngày sớm hơn
                    if (!isSeparatedThisMonth || terminateDay < effectiveLastDay) {
                        effectiveLastDay = terminateDay;
                        isSeparatedThisMonth = true;
                        separationReason = 'TERMINATION';
                    }
                }
            }

            // Nhân viên đã nghỉ việc/sa thải chỉ được tính lương ở đúng tháng chấm dứt
            if ([Status.RESIGNED, Status.TERMINATED].includes(employee.status) && !isSeparatedThisMonth) {
                throw new BadRequestException('Nhân viên đã chấm dứt công việc, chỉ được tính lương ở tháng chấm dứt');
            }

            // 5. Tính số ngày nghỉ KHÔNG LƯƠNG trong tháng
            // Logic: Query các đơn APPROVED, Type != ANNUAL, nằm trong tháng
            // (Đây là logic đơn giản hóa, thực tế phải tính giao nhau giữa khoảng ngày nghỉ và tháng)
            const dbHolidayDates = dbHolidays.map(h => new Date(h.date));
            const unpaidLeaves = await this.getUnpaidLeaveDays(employeeId, month, year, txManager, dbHolidayDates);

            // 6. Tính toán số ngày làm việc thực tế
            let actualWorkDays: number;

            if (isSeparatedThisMonth) {
                // Tính số ngày làm việc thực tế từ đầu tháng đến ngày nghỉ việc (loại trừ cuối tuần & ngày lễ)
                actualWorkDays = calculateWorkingDays(startOfMonth, effectiveLastDay, dbHolidayDates);
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
            const settings = await txManager.getRepository(SystemSetting).find({ where: { isActive: true } });

            const settingMap = new Map(settings.map(s => [s.key, Number(s.value)]));

            // Tính tỷ lệ cho phụ cấp (nếu nghỉ việc giữa tháng hoặc nghỉ không lương nhiều)
            const allowanceRatio = actualWorkDays / STANDARD_WORK_DAYS;

            // A. Khoản ăn trưa (tính theo tỷ lệ ngày làm việc)
            const fullLunchAmount = settingMap.get(SETTING_KEYS.LUNCH) || 0;
            const lunchAmount = fullLunchAmount * allowanceRatio;

            // B. Khoản đi lại (tính theo tỷ lệ ngày làm việc)
            const fullTransportAmount = settingMap.get(SETTING_KEYS.TRANSPORT) || 0;
            const transportAmount = fullTransportAmount * allowanceRatio;

            // Trần lương thực tế để tính BHXH, BHYT, BHTN
            // Lương đóng BH = lương cơ bản + phụ cấp CỐ ĐỊNH theo hợp đồng (không tỷ lệ hóa)
            // Nhưng bị giới hạn tối đa = 20 × lương cơ sở
            // Tháng 1-2/2026: Tiếp tục áp dụng mức lương cơ sở cũ là 2.340.000 đồng/tháng theo Nghị định 73/2024/NĐ-CP.
            const insuranceSalary = baseSalary + (fullLunchAmount + fullTransportAmount); // Dùng phụ cấp đầy đủ theo hợp đồng
            const maxInsuranceSalary = 20 * (settingMap.get(SETTING_KEYS.BASE_SALARY) || 0);

            // C. Bảo hiểm xã hội (BHXH - tính trên lương thực tế)
            const bhxhRate = (settingMap.get(SETTING_KEYS.BHXH_RATE) || 0) / 100;
            let bhxhAmount = insuranceSalary * bhxhRate;

            // D. Bảo hiểm y tế (BHYT - tính trên lương thực tế)
            const bhytRate = (settingMap.get(SETTING_KEYS.BHYT_RATE) || 0) / 100;
            let bhytAmount = insuranceSalary * bhytRate;

            // E. Bảo hiểm thất nghiệp (BHTN - tính trên lương thực tế)
            const bhtnRate = (settingMap.get(SETTING_KEYS.BHTN_RATE) || 0) / 100;
            let bhtnAmount = insuranceSalary * bhtnRate;

            // Kiểm tra trần lương đóng bảo hiểm
            if (insuranceSalary > maxInsuranceSalary) {
                const excess = insuranceSalary - maxInsuranceSalary;
                // Điều chỉnh lại các khoản bảo hiểm nếu vượt trần
                const excessRatio = excess / insuranceSalary;
                bhxhAmount -= bhxhAmount * excessRatio;
                bhytAmount -= bhytAmount * excessRatio;
                bhtnAmount -= bhtnAmount * excessRatio;
            }

            // 7. Quyết toán phép năm (nếu nhân viên nghỉ việc trong tháng này)
            let annualLeaveSettlement = 0;
            if (isSeparatedThisMonth && employee.remainingLeave > 0) {
                annualLeaveSettlement = salaryPerDay * employee.remainingLeave;
                finalSalary += annualLeaveSettlement;
            }

            // Đóng gói vào details
            const details = {
                [COMPONENT_KEYS.LUNCH]: Math.round(lunchAmount * 100) / 100,
                [COMPONENT_KEYS.TRANSPORT]: Math.round(transportAmount * 100) / 100,
                [COMPONENT_KEYS.BHXH]: Math.round(bhxhAmount * 100) / 100,
                [COMPONENT_KEYS.BHYT]: Math.round(bhytAmount * 100) / 100,
                [COMPONENT_KEYS.BHTN]: Math.round(bhtnAmount * 100) / 100,
                annualLeaveSettlement: Math.round(annualLeaveSettlement * 100) / 100
            };

            // Tính tổng phụ cấp và trừ các khoản bảo hiểm NLĐ phải đóng (BHXH 8% + BHYT 1.5% + BHTN 1%)
            const allowance = lunchAmount + transportAmount;
            const deduction = bhxhAmount + bhytAmount + bhtnAmount;
            //finalSalary = finalSalary + allowance - deduction;

            //F. Tính thuế TNCN
            const { pitAmount } = TaxCalculator.calculatePIT(
                finalSalary + allowance,
                employee.dependentCount,
                deduction, // Các khoản bảo hiểm được trừ vào thu nhập chịu thuế
            );

            details["PIT"] = Math.round(pitAmount * 100) / 100;

            finalSalary = finalSalary + allowance - deduction - pitAmount;

            // 8. Lưu/Cập nhật vào DB
            // Nếu chưa có thì tạo mới, có rồi (nhưng chưa pay) thì update
            let result: Payslip;
            const note = isSeparatedThisMonth
                ? `${separationReason === 'TERMINATION' ? 'Sa thải' : 'Nghỉ việc'} ngày ${effectiveLastDay.toLocaleDateString('vi-VN')}${annualLeaveSettlement > 0 ? ` - Quyết toán ${employee.remainingLeave} ngày phép: ${annualLeaveSettlement.toLocaleString('vi-VN')}đ` : ''}`
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
        };

        if (manager) {
            return calculate(manager);
        }

        return this.dataSource.transaction(async (txManager) => calculate(txManager));
    }

    // Helper: Tính ngày nghỉ không lương
    private async getUnpaidLeaveDays(empId: string, month: number, year: number, manager?: EntityManager, holidays: Date[] = []): Promise<number> {
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
            .andWhere('leave_requests.type IN (:...types)', { types: [LeaveRequestType.UNPAID, LeaveRequestType.SICK] }) // Chỉ trừ ngày nghỉ không lương (ví dụ)
            .andWhere('leave_requests.startDate <= :endOfMonth', { endOfMonth })
            .andWhere('leave_requests.endDate >= :startOfMonth', { startOfMonth })
            .getMany();

        /**
         * Khi nhân viên xin nghỉ ốm (có giấy chứng nhận của bệnh viện), doanh nghiệp không có trách nhiệm trả lương cho những ngày đó.
         * Thay vào đó, Cơ quan Bảo hiểm Xã hội (BHXH) sẽ là bên đứng ra chi trả tiền trợ cấp ốm đau cho nhân viên (thường là 75% mức lương đóng bảo hiểm của tháng liền kề).
         */

        // Cần thêm isBhxhClaimed để lập hồ sơ BHXH chi trả cho nhân viên, tránh trường hợp nhân viên nghỉ ốm nhưng không làm thủ tục BHXH thì công ty lại phải trả lương bình thường

        let totalDays = 0;
        for (const leave of leaves) {
            // Logic tính giao nhau (Intersection) giữa khoảng nghỉ và tháng hiện tại
            // Code này đảm bảo nếu nghỉ từ 28/1 đến 2/2 thì tháng 1 chỉ tính 28,29,30,31
            const start = leave.startDate < startOfMonth ? startOfMonth : leave.startDate;
            const end = leave.endDate > endOfMonth ? endOfMonth : leave.endDate;

            // Công thức tính số ngày làm việc thực tế trong khoảng nghỉ (loại trừ T7, CN, ngày lễ)
            // BUG FIX: dùng calculateWorkingDays thay vì đếm ngày lịch để khớp với STANDARD_WORK_DAYS
            const days = calculateWorkingDays(start, end, holidays);
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
        userId: string,
        search?: string,
        month?: number,
        year?: number,
        page?: number,
        pageSize?: number
    ): Promise<{ items: Payslip[], total: number }> {
        let departmentId: string | undefined = undefined;
        const user = await this.dataSource.getRepository(User).findOne({
            where: { id: userId },
            relations: ['employee', 'role', 'role.permissions'],
        });
        if (!user) throw new BadRequestException(`User not found: ${userId}`);

        const permissions = user.role?.permissions ?? [];
        const isAdmin = permissions.some(p => p.permission_code === PORTAL_PERMISSIONS.ADMIN);
        const isHR = permissions.some(p => p.permission_code === EMPLOYEE_PERMISSIONS.CREATE);

        if (!isAdmin && !isHR) {
            if (user.employee) {
                // Manager: chỉ được xem phòng ban mình quản lý
                const managedDepartment = await this.dataSource.getRepository(Department)
                    .findOne({ where: { managerId: user.employee.id } });
                if (!managedDepartment) {
                    // Nhân viên thường: không trả về dữ liệu
                    return { items: [], total: 0 };
                }
                departmentId = managedDepartment.id;
            } else {
                return { items: [], total: 0 };
            }
        }
        // isAdmin hoặc isHR: departmentId = undefined → xem tất cả phòng ban
        const effectivePage = page || 1;
        const effectivePageSize = pageSize || 10;
        const normalizedSearch = search?.trim().toLowerCase() || 'all';
        const cacheKey = `payslips:all:${normalizedSearch}:${month || 'all'}:${year || 'all'}:${departmentId || 'all'}:${effectivePage}:${effectivePageSize}`;

        const cached = await this.redisService.get<{ items: Payslip[], total: number }>(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.payslipRepository.findAllPayslipsFilteredAndPaged(search, month, year, effectivePage, effectivePageSize, undefined, departmentId);
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

        // Clear cache
        await this.redisService.delByPrefix('payslips:all:');
        await this.redisService.delByPrefix('unpaid_leaves:');
        await this.redisService.delByPrefix('my_payslips:');
        return result;
    }

    async getMyPayslips(
        userId: string,
        month?: number,
        year?: number,
        page?: number,
        pageSize?: number
    ): Promise<{ items: Payslip[], total: number }> {
        const employee = await this.employeeRepository.findOne({
            where: { user: { id: userId } }
        });
        if (!employee) {
            throw new NotFoundException('Employee not found for user');
        }
        const employeeId = employee.id;
        const cacheKey = `my_payslips:${employeeId}:${month || 'all'}:${year || 'all'}:${page || 'all'}:${pageSize || 'all'}`;
        const cached = await this.redisService.get<{ items: Payslip[], total: number }>(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.payslipRepository.findAllPayslipsFilteredAndPaged(undefined, month, year, page, pageSize, employeeId);
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

    async getYearlyPayslipsForEmployee(
        userId: string,
        year: number
    ): Promise<{ details: Payslip[], totalSalary: number, totalBaseSalary: number }> {
        const employee = await this.employeeRepository.findOne({
            where: { user: { id: userId } }
        });

        if (!employee) {
            throw new NotFoundException('Employee not found for user');
        }

        const yearlyData = await this.payslipRepository.createQueryBuilder('payslip')
            .select('SUM(payslip.finalSalary)', 'totalSalary')
            .addSelect('SUM(payslip.baseSalary)', 'totalBaseSalary')
            .where('payslip.employee_id = :empId', { empId: employee.id })
            .andWhere('payslip.year = :year', { year })
            .andWhere('payslip.isPaid = true') // Chỉ tính lương đã thanh toán
            .getRawOne();

        if (!yearlyData || !yearlyData.totalSalary) {
            throw new NotFoundException(`Chưa có dữ liệu lương năm ${year}`);
        }

        const monthlyDetails = await this.payslipRepository.find({
            where: {
                employee: { id: employee.id },
                year,
                isPaid: true // Chỉ lấy những tháng đã thanh toán
            },
            relations: ['employee', 'employee.department', 'employee.currentPosition'],
            order: { month: 'ASC' }
        });

        return {
            details: monthlyDetails,
            totalSalary: yearlyData.totalSalary || 0,
            totalBaseSalary: yearlyData.totalBaseSalary || 0
        };
    }
}