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
import { Role } from "@/entities/role.entity";
import { PORTAL_PERMISSIONS } from "@libs/shared/constants/portal-permissions.constant";

@Injectable()
export class LeaveRequestService {
    constructor(
        private readonly leaveRequestRepository: LeaveRequestRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    // 1. Tạo đơn nghỉ phép
    async create(userId: string, dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
        return this.dataSource.transaction(async (manager) => {
            // A. Tìm Employee từ UserID đăng nhập
            const employeeRepo = manager.getRepository(Employee);
            // Dùng pessimistic_write lock để tránh race condition khi nhiều request cùng lúc
            const employee = await employeeRepo.findOne({
                where: { user: { id: userId } },
                lock: { mode: 'pessimistic_write' }
            });
            if (!employee) throw new BadRequestException('This user is not associated with any employee');

            const start = new Date(dto.startDate);
            const end = new Date(dto.endDate);

            if (start > end) throw new BadRequestException('Start date cannot be after end date');

            // Lấy danh sách ngày lễ từ database
            const holidayRepo = manager.getRepository(Holiday);
            const dbHolidays = await holidayRepo.find();

            const duration = calculateWorkingDays(start, end, dbHolidays.map(h => h.date));

            if (duration <= 0) {
                throw new BadRequestException('You have selected only holidays/weekends, no need to create a leave request.');
            }

            // CHECK QUỸ PHÉP NĂM
            if (dto.type === LeaveRequestType.ANNUAL) {
                const remaining = employee.totalAnnualLeave - employee.usedAnnualLeave;

                if (remaining < duration) {
                    throw new BadRequestException(
                        `Bạn không đủ phép năm! Số dư: ${remaining} ngày. Vui lòng chọn loại nghỉ "Không lương".`
                    );
                }
            }

            // B. Kiểm tra trùng lịch (Overlap Check) - QUAN TRỌNG
            // Logic: Tìm xem có đơn nào (Pending hoặc Approved) dính vào khoảng thời gian này không
            const leaveRepo = manager.getRepository(LeaveRequest);
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

            // C. Lưu đơn
            const request = leaveRepo.create({
                ...dto,
                employee,
                duration,
                status: LeaveRequestStatus.PENDING,
            });

            const saved = await leaveRepo.save(request);

            // Clear cache - chỉ xóa cache liên quan đến employee này
            await this.redisService.delByPrefix(`leave_requests:`);
            await this.redisService.delByPrefix(`employees:`);
            await this.redisService.delByPrefix(`my_leave_requests:`);

            return saved;
        });
    }

    async findAllWithFilteredAndPaged(
        status?: string,
        startDateFrom?: Date,
        startDateTo?: Date,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: LeaveRequest[], total: number }> {

        const rawKey = JSON.stringify({
            status,
            startDateFrom,
            startDateTo,
            page: page || 1,
            pageSize: pageSize || 10,
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
            page,
            pageSize,
        );

        await this.redisService.set(cacheKey, result, 300); // Cache for 5 minutes
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
        await this.redisService.set(cacheKey, result, 300); // Cache for 5 minutes
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

            // Chỉ cho phép update nếu đơn đang ở trạng thái PENDING
            if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
                throw new BadRequestException('Can only update leave requests that are pending');
            }

            // Chỉ cho phép update sang APPROVED hoặc REJECTED
            if (status !== LeaveRequestStatus.APPROVED && status !== LeaveRequestStatus.REJECTED) {
                throw new BadRequestException('Can only update status to Approved or Rejected');
            }

            // Validate rejection reason
            if (status === LeaveRequestStatus.REJECTED && !rejectionReason) {
                throw new BadRequestException('Reason is required when rejecting a leave request');
            }

            leaveRequest.status = status;
            leaveRequest.approver = { id: approverId } as User;

            // Nếu từ chối, lưu lý do từ chối vào field riêng
            if (status === LeaveRequestStatus.REJECTED && rejectionReason) {
                leaveRequest.rejectionReason = rejectionReason;
            }

            // Nếu HR Duyệt đơn Phép năm -> Trừ quỹ
            if (status === LeaveRequestStatus.APPROVED && leaveRequest.type === LeaveRequestType.ANNUAL) {
                // 🔹 RE-CHECK QUỸ PHÉP NĂM (tránh race condition)
                const employee = await manager.getRepository(Employee).findOne({
                    where: { id: leaveRequest.employeeId },
                    lock: { mode: 'pessimistic_write' } // Lock để tránh race condition
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

                // 🔹 RE-CHECK OVERLAP (tránh duyệt 2 đơn trùng lịch)
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

                // Trừ quỹ - cập nhật trực tiếp, log giá trị để debug
                const before = employee.usedAnnualLeave;
                employee.usedAnnualLeave += leaveRequest.duration;
                const after = employee.usedAnnualLeave;
                await manager.save(employee);
            }

            const result = await leaveRequestRepo.save(leaveRequest);

            // Clear cache - chỉ xóa cache liên quan đến employee này
            await this.redisService.delByPrefix(`leave_requests:`);
            await this.redisService.delByPrefix(`employees:`);
            await this.redisService.delByPrefix(`my_leave_requests:`);
            return result;
        });
    }
}