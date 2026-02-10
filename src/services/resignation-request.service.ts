import { CreateResignationDto } from "@/dtos/resignation-request.dto";
import { Employee } from "@/entities/employee.entity";
import { ResignationRequest } from "@/entities/resignation-request.entity";
import { User } from "@/entities/user.entity";
import { ResignationRequestRepository } from "@/repositories/resignation-request.repository";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { ResignationStatus } from "@libs/shared/enums/resignation-status.enum";
import { UserStatus } from "@libs/shared/enums/user-status.enum";
import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { DataSource, LessThanOrEqual } from "typeorm";
import { RedisService } from "./redis.service";

@Injectable()
export class ResignationRequestService {
    // Service methods would go here
    constructor(
        private readonly resignationRequestRepository: ResignationRequestRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    //Nhân viên nộp đơn nghỉ việc
    async create(dto: CreateResignationDto): Promise<ResignationRequest> {
        const existingRequest = await this.resignationRequestRepository.findOne({
            where: {
                employee: { id: dto.employeeId },
                status: ResignationStatus.PENDING,
            },
        });
        if (existingRequest) {
            throw new Error('There is already a pending resignation request for this employee.');
        }

        const newRequest = this.resignationRequestRepository.create({
            employeeId: dto.employeeId,
            submitDate: new Date(),
            desiredLastDay: dto.desiredLastDay,
            reason: dto.reason,
            handoverNote: dto.handoverNote,
            status: ResignationStatus.PENDING,
        });
        await this.redisService.delByPrefix('resignation_requests:');
        return this.resignationRequestRepository.save(newRequest);
    }

    //HR duyệt đơn nghỉ việc
    async approve(id: string, approvedLastDay: Date, hrNote?: string): Promise<ResignationRequest> {
        const resignationRequest = await this.resignationRequestRepository.findOne({
            where: { id }, relations: ['employee']
        });
        if (!resignationRequest) {
            throw new Error('Resignation request not found.');
        }
        resignationRequest.status = ResignationStatus.APPROVED;
        resignationRequest.approvedLastDay = approvedLastDay;
        resignationRequest.hrNote = hrNote || resignationRequest.hrNote;
        await this.redisService.delByPrefix('resignation_requests:');
        return this.resignationRequestRepository.save(resignationRequest);
    }

    //HR từ chối đơn nghỉ việc
    async reject(id: string, hrNote: string): Promise<ResignationRequest> {
        const resignationRequest = await this.resignationRequestRepository.findOne({
            where: { id }, relations: ['employee']
        });
        if (!resignationRequest) {
            throw new Error('Resignation request not found.');
        }
        resignationRequest.status = ResignationStatus.REJECTED;
        resignationRequest.hrNote = hrNote;
        await this.redisService.delByPrefix('resignation_requests:');
        return this.resignationRequestRepository.save(resignationRequest);
    }

    //Cron Job: Chạy mỗi đêm để quét các đơn đã đến hạn (OFFBOARDING AUTOMATION)
    // Không cần controller vì chạy ngầm
    async processDueResignations(): Promise<void> {
        const logger = new Logger(ResignationRequestService.name);

        return this.dataSource.transaction(async (manager) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày

            // Tìm các đơn đã Duyệt + Ngày nghỉ nhỏ hơn hoặc bằng hôm nay + Chưa hoàn tất
            const dueResignations = await manager.getRepository(ResignationRequest).find({
                where: {
                    status: ResignationStatus.APPROVED,
                    approvedLastDay: LessThanOrEqual(today),
                },
                relations: ['employee', 'employee.user'],
            });

            logger.log(`Found ${dueResignations.length} due resignations to process`);

            for (const resignation of dueResignations) {
                try {
                    if (!resignation.employee) {
                        logger.warn(`Resignation ${resignation.id} has no employee`);
                        continue;
                    }

                    // Khóa tài khoản user
                    if (resignation.employee.user) {
                        await manager.getRepository(User).update(
                            resignation.employee.user.id,
                            { isActive: false, status: UserStatus.BANNED }
                        );
                    }

                    // Cập nhật trạng thái nhân viên
                    await manager.getRepository(Employee).update(
                        resignation.employee.id,
                        { status: Status.RESIGNED }
                    );

                    // Cập nhật trạng thái đơn nghỉ việc
                    await manager.getRepository(ResignationRequest).update(
                        resignation.id,
                        { status: ResignationStatus.COMPLETED }
                    );

                    logger.log(`Offboarded employee: ${resignation.employee.fullName}`);
                } catch (error) {
                    logger.error(`Failed to process resignation ${resignation.id}`, error.stack);
                    throw error; // Re-throw để rollback transaction
                }
            }
        });
    }

    async findAllFilteredAndPaged(
        status?: string,
        employeeName?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: ResignationRequest[]; total: number }> {
        const rawKey = JSON.stringify({
            status,
            employeeName,
            page: page || 1,
            pageSize: pageSize || 10,
        });
        const cacheKey = `resignation_requests:${createHash('md5').update(rawKey).digest('hex')}`;
        const cacheResult = await this.redisService.get<{ items: ResignationRequest[]; total: number }>(cacheKey);
        if (cacheResult) {
            return cacheResult;
        }
        const result = await this.resignationRequestRepository.findAllFilteredAndPaged(
            status,
            employeeName,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300); // Cache trong 5 phút
        return result;
    }

    async getById(id: string): Promise<ResignationRequest | null> {
        return this.resignationRequestRepository.findOne({
            where: { id },
            relations: ['employee', 'approver'],
        });
    }

    async findAllByEmployeeId(employeeId: string): Promise<ResignationRequest[]> {
        return this.resignationRequestRepository.find({
            where: { employeeId },
            order: { submitDate: 'DESC' },
        });
    }
}