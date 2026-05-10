import { CreateLeaveRequestDto } from "@/dtos/leave-requests.dto";
import { LeaveRequest } from "@/entities/leave-request.entity";
import { LeaveRequestRepository } from "@/repositories/leave-request.repository";
import { LeaveRequestStatus, LeaveRequestType } from "@libs/shared/enums/leave-request-status.enum";
import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";
import { createHash } from "crypto";
import { Employee } from "@/entities/employee.entity";
import { calculateWorkingDays } from "@/utils/date.util";
import { User } from "@/entities/user.entity";
import { Holiday } from "@/entities/holiday.entity";
import { Department } from "@/entities/department.entity";
import { PORTAL_PERMISSIONS } from "@libs/shared/constants/portal-permissions.constant";
import { EMPLOYEE_PERMISSIONS } from "@libs/shared/constants/permissions.constant";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { FileService } from "./file.service";
import dayjs from 'dayjs';

const MATERNITY_DAYS = 180;
const DEFAULT_ANNUAL_LEAVE_DAYS = 12;

@Injectable()
export class LeaveRequestService {
    constructor(
        private readonly leaveRequestRepository: LeaveRequestRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
        private readonly fileService: FileService,
    ) { }

    async calculateWorkingDays(startDate: Date, endDate: Date): Promise<number> {
        const holidayRepo = this.dataSource.getRepository(Holiday);
        const dbHolidays = await holidayRepo.find();
        return calculateWorkingDays(startDate, endDate, dbHolidays.map(h => h.date));
    }

    async create(
        userId: string,
        dto: CreateLeaveRequestDto,
        documentFile?: Express.Multer.File,
    ): Promise<LeaveRequest> {
        return this.dataSource.transaction(async (manager) => {
            const employeeRepo = manager.getRepository(Employee);
            const employee = await employeeRepo.findOne({
                where: { user: { id: userId } },
                lock: { mode: 'pessimistic_write' }
            });
            if (!employee) throw new BadRequestException('This user is not associated with any employee');

            const start = new Date(dto.startDate);
            let end: Date;
            let documentUrl = dto.documentUrl;

            if (documentFile) {
                documentUrl = await this.fileService.uploadFile(documentFile, 'leave-requests');
            }

            // MATERNITY: tự động tính endDate = startDate + 180 ngày, bắt buộc documentUrl
            if (dto.type === LeaveRequestType.MATERNITY) {
                if (!documentUrl) {
                    throw new BadRequestException('Thai sản bắt buộc phải đính kèm tệp minh chứng (documentUrl)');
                }
                end = new Date(start);
                end.setDate(end.getDate() + MATERNITY_DAYS - 1);
            } else {
                if (!dto.endDate) {
                    throw new BadRequestException('endDate là bắt buộc với loại nghỉ phép này');
                }
                end = new Date(dto.endDate);
            }

            // Nghỉ ốm
            if (dto.type === LeaveRequestType.SICK) {
                if (!documentUrl) {
                    throw new BadRequestException('Nghỉ ốm bắt buộc phải đính kèm tệp minh chứng (documentUrl)');
                }
            }

            if (start > end) throw new BadRequestException('Start date cannot be after end date');

            const holidayRepo = manager.getRepository(Holiday);
            const dbHolidays = await holidayRepo.find();
            const holidaySet = new Set(dbHolidays.map(h => dayjs(h.date).format('YYYY-MM-DD')));
            const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
            const isWorkingDay = (d: Date) => !isWeekend(d) && !holidaySet.has(d.toISOString().split('T')[0]);
            const addWorkingDays = (startDate: Date, daysToAdd: number): Date => {
                const d = new Date(startDate);
                let added = 0;
                while (added < daysToAdd) {
                    d.setDate(d.getDate() + 1);
                    if (isWorkingDay(d)) {
                        added += 1;
                    }
                }
                return d;
            };

            const duration = calculateWorkingDays(start, end, dbHolidays.map(h => h.date));

            if (duration <= 0) {
                throw new BadRequestException('You have selected only holidays/weekends, no need to create a leave request.');
            }

            const leaveRepo = manager.getRepository(LeaveRequest);

            // Kiểm tra trùng lịch
            const overlap = await leaveRepo.createQueryBuilder('leave_requests')
                .where('leave_requests.employeeId = :empId', { empId: employee.id })
                .andWhere('leave_requests.status IN (:...statuses)',
                    { statuses: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] })
                .andWhere('leave_requests.startDate <= :end', { end })
                .andWhere('leave_requests.endDate >= :start', { start })
                .getOne();

            if (overlap) {
                throw new BadRequestException(`You already have a leave request from ${overlap.startDate} to ${overlap.endDate}`);
            }

            // CHECK QUỸ PHÉP NĂM
            if (dto.type === LeaveRequestType.ANNUAL) {
                const remaining = employee.totalAnnualLeave - employee.usedAnnualLeave;

                if (remaining < duration) {
                    if (remaining <= 0) {
                        throw new BadRequestException(
                            `❌ Bạn đã hết phép năm (Còn lại: 0 ngày).\n` +
                            `📌 Giải pháp: Vui lòng chọn loại nghỉ "Không lương" (UNPAID) để tiếp tục.`
                        );
                    }

                    if (dto.autoSplitIfInsufficient) {
                        const unpaidDays = duration - remaining;
                        const annualEnd = remaining > 0 ? addWorkingDays(start, remaining - 1) : start;
                        const unpaidStart = addWorkingDays(annualEnd, 1);

                        const annualRequest = leaveRepo.create({
                            ...dto,
                            employee,
                            duration: remaining,
                            type: LeaveRequestType.ANNUAL,
                            startDate: start,
                            endDate: annualEnd,
                            reason: dto.reason + ` [Phần 1/${remaining} ngày phép năm]`,
                            status: LeaveRequestStatus.PENDING,
                        });
                        await leaveRepo.save(annualRequest);

                        const unpaidRequest = leaveRepo.create({
                            ...dto,
                            employee,
                            duration: unpaidDays,
                            type: LeaveRequestType.UNPAID,
                            startDate: unpaidStart,
                            endDate: end,
                            reason: dto.reason + ` [Phần 2/${unpaidDays} ngày không lương]`,
                            status: LeaveRequestStatus.PENDING,
                        });
                        await leaveRepo.save(unpaidRequest);

                        await this.redisService.delByPrefix(`leave_requests:`);
                        await this.redisService.delByPrefix(`employees:`);
                        await this.redisService.delByPrefix(`my_leave_requests:`);

                        return annualRequest;
                    }

                    const unpaidDays = duration - remaining;
                    throw new BadRequestException(
                        `❌ Không đủ quỹ phép năm!\n\n` +
                        `📊 Thông tin chi tiết:\n` +
                        `   • Tổng phép năm: ${employee.totalAnnualLeave} ngày\n` +
                        `   • Đã sử dụng: ${employee.usedAnnualLeave} ngày\n` +
                        `   • Còn lại: ${remaining} ngày\n` +
                        `   • Bạn đang yêu cầu: ${duration} ngày\n` +
                        `   • Thiếu: ${unpaidDays} ngày\n\n` +
                        `✅ Giải pháp 1 (Khuyến nghị):\n` +
                        `   Tạo 2 đơn riêng biệt:\n` +
                        `   1️⃣ Đơn Phép năm: ${remaining} ngày (từ ${dto.startDate})\n` +
                        `   2️⃣ Đơn Không lương: ${unpaidDays} ngày (tiếp theo)\n\n` +
                        `✅ Giải pháp 2 (Tự động):\n` +
                        `   Gửi lại request với flag "autoSplitIfInsufficient": true\n` +
                        `   Hệ thống sẽ tự động tách thành 2 đơn cho bạn.`
                    );
                }
            }

            const request = leaveRepo.create({
                ...dto,
                endDate: end,
                documentUrl,
                employee,
                duration,
                status: LeaveRequestStatus.PENDING,
            });

            const saved = await leaveRepo.save(request);

            await this.redisService.delByPrefix(`leave_requests:`);
            await this.redisService.delByPrefix(`employees:`);
            await this.redisService.delByPrefix(`my_leave_requests:`);

            return saved;
        });
    }

    async findAllWithFilteredAndPaged(
        userId: string,
        status?: string,
        startDateFrom?: Date,
        startDateTo?: Date,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: LeaveRequest[], total: number }> {
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
                const managedDepartment = await this.dataSource.getRepository(Department)
                    .findOne({ where: { managerId: user.employee.id } });
                if (!managedDepartment) {
                    return { items: [], total: 0 };
                }
                departmentId = managedDepartment.id;
            } else {
                return { items: [], total: 0 };
            }
        }

        const effectivePage = page || 1;
        const effectivePageSize = pageSize || 10;
        const rawKey = JSON.stringify({
            userId,
            status,
            startDateFrom,
            startDateTo,
            departmentId,
            page: effectivePage,
            pageSize: effectivePageSize,
        });
        const cacheKey = `leave_requests:${createHash('md5').update(rawKey).digest('hex')}`;
        const cachedResult = await this.redisService.get<{ items: LeaveRequest[]; total: number }>(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        const result = await this.leaveRequestRepository.findAll(
            status,
            startDateFrom,
            startDateTo,
            effectivePage,
            effectivePageSize,
            departmentId,
        );

        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async findAllByUserIdWithFilteredAndPaged(
        userId: string,
        status?: string,
        startDateFrom?: Date,
        startDateTo?: Date,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: LeaveRequest[], total: number }> {
        const rawKey = JSON.stringify({
            userId,
            status,
            startDateFrom,
            startDateTo,
            page: page || 1,
            pageSize: pageSize || 10,
        });
        const cacheKey = `my_leave_requests:${createHash('md5').update(rawKey).digest('hex')}`;
        const cachedResult = await this.redisService.get<{ items: LeaveRequest[]; total: number }>(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        const result = await this.leaveRequestRepository.findAllByUserId(
            userId,
            status,
            startDateFrom,
            startDateTo,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async updateStatus(
        leaveRequestId: string,
        status: LeaveRequestStatus,
        approverId: string,
        rejectionReason?: string,
    ): Promise<LeaveRequest> {
        return this.dataSource.transaction(async (manager) => {
            const leaveRequestRepo = manager.getRepository(LeaveRequest);
            const leaveRequest = await leaveRequestRepo.findOne({
                where: { id: leaveRequestId },
                relations: ['employee']
            });
            if (!leaveRequest) {
                throw new BadRequestException('Leave request does not exist');
            }

            if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
                throw new BadRequestException('Can only update leave requests that are pending');
            }

            if (status !== LeaveRequestStatus.APPROVED && status !== LeaveRequestStatus.REJECTED) {
                throw new BadRequestException('Can only update status to Approved or Rejected');
            }

            if (status === LeaveRequestStatus.REJECTED && !rejectionReason) {
                throw new BadRequestException('Reason is required when rejecting a leave request');
            }

            leaveRequest.status = status;
            leaveRequest.approver = { id: approverId } as User;

            if (status === LeaveRequestStatus.REJECTED && rejectionReason) {
                leaveRequest.rejectionReason = rejectionReason;
            }

            if (status === LeaveRequestStatus.APPROVED && leaveRequest.type === LeaveRequestType.ANNUAL) {
                const employee = await manager.getRepository(Employee).findOne({
                    where: { id: leaveRequest.employeeId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (!employee) {
                    throw new BadRequestException('Employee not found');
                }

                const remaining = employee.totalAnnualLeave - employee.usedAnnualLeave;
                if (remaining < leaveRequest.duration) {
                    throw new BadRequestException(
                        `Không đủ quỹ phép năm! Còn lại: ${remaining} ngày, cần: ${leaveRequest.duration} ngày`
                    );
                }

                const overlap = await leaveRequestRepo.createQueryBuilder('lr')
                    .where('lr.employeeId = :empId', { empId: leaveRequest.employeeId })
                    .andWhere('lr.id != :currentId', { currentId: leaveRequestId })
                    .andWhere('lr.status = :approved', { approved: LeaveRequestStatus.APPROVED })
                    .andWhere('lr.startDate <= :end', { end: leaveRequest.endDate })
                    .andWhere('lr.endDate >= :start', { start: leaveRequest.startDate })
                    .getOne();

                if (overlap) {
                    throw new BadRequestException(
                        `Trùng lịch với đơn đã duyệt từ ${overlap.startDate.toISOString().split('T')[0]} đến ${overlap.endDate.toISOString().split('T')[0]}`
                    );
                }

                const before = Number(employee.usedAnnualLeave);
                const duration = Number(leaveRequest.duration);
                employee.usedAnnualLeave = before + duration;

                console.log(`Trừ phép năm cho Employee ID ${employee.id}: ${before} -> ${employee.usedAnnualLeave} (thêm ${duration} ngày)`);

                if (employee.usedAnnualLeave > employee.totalAnnualLeave) {
                    throw new BadRequestException(
                        `🚨 BẢO VỆ: Phát hiện việc trừ phép sẽ tạo ra số dư âm! ` +
                        `(Used: ${employee.usedAnnualLeave}, Total: ${employee.totalAnnualLeave}).`
                    );
                }

                await manager.save(employee);
            }

            const result = await leaveRequestRepo.save(leaveRequest);

            await this.redisService.delByPrefix(`leave_requests:`);
            await this.redisService.delByPrefix(`employees:`);
            await this.redisService.delByPrefix(`my_leave_requests:`);
            return result;
        });
    }

    // Cron: chạy mỗi ngày 00:00 — cập nhật WorkStatus nhân viên thai sản
    async processMaternityLeave(): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        await this.dataSource.transaction(async (manager) => {
            const leaveRepo = manager.getRepository(LeaveRequest);
            const employeeRepo = manager.getRepository(Employee);

            // today == startDate → chuyển MATERNITY_LEAVE
            const startingToday = await leaveRepo.createQueryBuilder('lr')
                .where('lr.type = :type', { type: LeaveRequestType.MATERNITY })
                .andWhere('lr.status = :status', { status: LeaveRequestStatus.APPROVED })
                .andWhere('DATE(lr.start_date) = :today', { today: today.toISOString().split('T')[0] })
                .getMany();

            for (const leave of startingToday) {
                await employeeRepo.update(leave.employeeId, { status: Status.MATERNITY_LEAVE });
                console.log(`[Maternity Cron] Employee ${leave.employeeId} → MATERNITY_LEAVE`);
            }

            // today == endDate + 1 → chuyển về ACTIVE
            const endingYesterday = await leaveRepo.createQueryBuilder('lr')
                .where('lr.type = :type', { type: LeaveRequestType.MATERNITY })
                .andWhere('lr.status = :status', { status: LeaveRequestStatus.APPROVED })
                .andWhere('DATE(lr.end_date) = :yesterday', { yesterday: yesterday.toISOString().split('T')[0] })
                .getMany();

            for (const leave of endingYesterday) {
                await employeeRepo.update(leave.employeeId, { status: Status.ACTIVE });
                console.log(`[Maternity Cron] Employee ${leave.employeeId} → ACTIVE`);
            }
        });

        await this.redisService.delByPrefix(`employees:`);
    }

    async resetAnnualLeaveBalances(): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            await manager.getRepository(Employee)
                .createQueryBuilder()
                .update(Employee)
                .set({ totalAnnualLeave: DEFAULT_ANNUAL_LEAVE_DAYS, usedAnnualLeave: 0 })
                .execute();
        });

        await this.redisService.delByPrefix(`employees:`);
    }

    // Quyết toán BHXH cho đơn thai sản và đơn ốm đau
    async claimBhxh(leaveRequestId: string): Promise<LeaveRequest> {
        const leaveRepo = this.dataSource.getRepository(LeaveRequest);
        const leaveRequest = await leaveRepo.findOne({ where: { id: leaveRequestId }, relations: ['employee'] });

        if (!leaveRequest) {
            throw new BadRequestException('Leave request does not exist');
        }
        if (leaveRequest.type !== LeaveRequestType.MATERNITY && leaveRequest.type !== LeaveRequestType.SICK) {
            throw new BadRequestException('Chỉ đơn thai sản hoặc đơn ốm đau mới có thể quyết toán BHXH');
        }
        if (leaveRequest.status !== LeaveRequestStatus.APPROVED) {
            throw new BadRequestException('Chỉ đơn đã được duyệt mới có thể quyết toán BHXH');
        }
        if (leaveRequest.isBhxhClaimed) {
            throw new BadRequestException('Đơn này đã được quyết toán BHXH rồi');
        }

        leaveRequest.isBhxhClaimed = true;
        const result = await leaveRepo.save(leaveRequest);

        await this.redisService.delByPrefix(`leave_requests:`);
        await this.redisService.delByPrefix(`my_leave_requests:`);
        return result;
    }
}
