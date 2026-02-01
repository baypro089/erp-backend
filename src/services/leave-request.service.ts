import { CreateLeaveRequestDto } from "@/dtos/leave-requests.dto";
import { LeaveRequest } from "@/entities/leave-request.entity";
import { LeaveRequestRepository } from "@/repositories/leave-request.repository";
import { LeaveRequestStatus } from "@libs/shared/enums/leave-request-status.enum";
import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";
import { createHash } from "crypto";
import { Employee } from "@/entities/employee.entity";

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
            const employee = await employeeRepo.findOne({ where: { user: { id: userId } } });
            if (!employee) throw new BadRequestException('This user is not associated with any employee');

            const start = new Date(dto.startDate);
            const end = new Date(dto.endDate);

            if (start > end) throw new BadRequestException('Start date cannot be after end date');

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
                status: LeaveRequestStatus.PENDING,
            });

            const saved = await leaveRepo.save(request);

            // Clear cache - chỉ xóa cache liên quan đến employee này
            await this.redisService.delByPrefix(`leave_requests:${employee.id}:`);
            await this.redisService.delByPrefix('leave_requests:all:');
            await this.redisService.delByPrefix(`employees:${employee.id}:`);

            return saved;
        });
    }

    async findAllWithFilteredAndPaged(
        userId: string,
        roleCode?: string,
        status?: string,
        startDateFrom?: Date,
        startDateTo?: Date,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: LeaveRequest[], total: number }> {

        const rawKey = JSON.stringify({
            userId,
            roleCode,
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
            userId,
            roleCode,
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
        reason?: string,
    ): Promise<LeaveRequest> {

        const leaveRequest = await this.leaveRequestRepository.findOne({ 
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
        if (status === LeaveRequestStatus.REJECTED && !reason) {
            throw new BadRequestException('Reason is required when rejecting a leave request');
        }

        leaveRequest.status = status;
        leaveRequest.approverId = approverId;

        // Nếu từ chối, lưu lý do từ chối
        if (status === LeaveRequestStatus.REJECTED && reason) {
            leaveRequest.reason = reason;
        }

        const result = await this.leaveRequestRepository.save(leaveRequest);

        // Clear cache - chỉ xóa cache liên quan đến employee này
        await this.redisService.delByPrefix(`leave_requests:${leaveRequest.employeeId}:`);
        await this.redisService.delByPrefix('leave_requests:all:');
        await this.redisService.delByPrefix(`employees:${leaveRequest.employeeId}:`);
        await this.redisService.delByPrefix(`unpaid_leaves:${leaveRequest.employeeId}:`);

        return result;
    }
}