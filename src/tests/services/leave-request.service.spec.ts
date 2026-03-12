import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestService } from '@/services/leave-request.service';
import { LeaveRequestRepository } from '@/repositories/leave-request.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { LeaveRequestStatus, LeaveRequestType } from '@libs/shared/enums/leave-request-status.enum';
import { Employee } from '@/entities/employee.entity';
import { Holiday } from '@/entities/holiday.entity';
import { LeaveRequest } from '@/entities/leave-request.entity';

const mockLeaveRepo = {
    findAll: jest.fn(),
    findAllByUserId: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

function buildTransactionMock(overrides: any = {}) {
    const employeeFindOne = overrides.employeeFindOne ?? jest.fn().mockResolvedValue({
        id: 'e1', totalAnnualLeave: 12, usedAnnualLeave: 0,
    });
    const holidayFind = overrides.holidayFind ?? jest.fn().mockResolvedValue([]);
    const leaveOverlap = overrides.leaveOverlap ?? jest.fn().mockResolvedValue(null);

    const leaveRepo = {
        create: jest.fn().mockReturnValue({ id: 'lr1', status: LeaveRequestStatus.PENDING }),
        save: jest.fn().mockResolvedValue({ id: 'lr1', status: LeaveRequestStatus.PENDING }),
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: leaveOverlap,
        }),
        findOne: overrides.leaveRepoFindOne ?? jest.fn().mockResolvedValue(null),
    };

    return {
        transaction: jest.fn((cb: any) => cb({
            getRepository: (entity: any) => {
                if (entity === Employee) return { findOne: employeeFindOne };
                if (entity === Holiday) return { find: holidayFind };
                if (entity === LeaveRequest) return leaveRepo;
                return { findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn().mockReturnValue({ where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(null) }) };
            },
        })),
    };
}

describe('LeaveRequestService', () => {
    let service: LeaveRequestService;

    async function buildService(dataSourceMock: any) {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LeaveRequestService,
                { provide: LeaveRequestRepository, useValue: mockLeaveRepo },
                { provide: DataSource, useValue: dataSourceMock },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        return module.get<LeaveRequestService>(LeaveRequestService);
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should throw if employee not found for user', async () => {
            const ds = buildTransactionMock({ employeeFindOne: jest.fn().mockResolvedValue(null) });
            service = await buildService(ds);
            await expect(service.create('u1', {
                startDate: '2026-04-01', endDate: '2026-04-02', type: LeaveRequestType.ANNUAL, reason: 'rest',
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw if start date is after end date', async () => {
            const ds = buildTransactionMock();
            service = await buildService(ds);
            await expect(service.create('u1', {
                startDate: '2026-04-05', endDate: '2026-04-02', type: LeaveRequestType.ANNUAL, reason: 'rest',
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw if annual leave days exceed balance', async () => {
            const ds = buildTransactionMock({
                employeeFindOne: jest.fn().mockResolvedValue({ id: 'e1', totalAnnualLeave: 2, usedAnnualLeave: 2 }),
            });
            service = await buildService(ds);
            await expect(service.create('u1', {
                startDate: '2026-04-01', endDate: '2026-04-03', type: LeaveRequestType.ANNUAL, reason: 'rest',
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw if dates overlap with existing leave', async () => {
            const ds = buildTransactionMock({
                leaveOverlap: jest.fn().mockResolvedValue({ id: 'existing', startDate: new Date(), endDate: new Date() }),
            });
            service = await buildService(ds);
            await expect(service.create('u1', {
                startDate: '2026-04-01', endDate: '2026-04-02', type: LeaveRequestType.UNPAID, reason: 'rest',
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should create leave request successfully', async () => {
            const ds = buildTransactionMock();
            service = await buildService(ds);
            const result = await service.create('u1', {
                startDate: '2026-04-01', endDate: '2026-04-02', type: LeaveRequestType.UNPAID, reason: 'rest',
            } as any);
            expect(result).toHaveProperty('id');
        });
    });

    describe('findAllWithFilteredAndPaged', () => {
        it('should return cached result on cache hit', async () => {
            const ds = buildTransactionMock();
            service = await buildService(ds);
            const cached = { items: [], total: 0 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllWithFilteredAndPaged();
            expect(result).toEqual(cached);
            expect(mockLeaveRepo.findAll).not.toHaveBeenCalled();
        });

        it('should fetch and cache on miss', async () => {
            const ds = buildTransactionMock();
            service = await buildService(ds);
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [{ id: 'lr1' }], total: 1 };
            mockLeaveRepo.findAll.mockResolvedValue(paged);
            const result = await service.findAllWithFilteredAndPaged();
            expect(result).toEqual(paged);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('updateStatus', () => {
        it('should throw if leave request not found', async () => {
            const ds = buildTransactionMock({
                leaveRepoFindOne: jest.fn().mockResolvedValue(null),
            });
            service = await buildService(ds);
            await expect(service.updateStatus('lr1', LeaveRequestStatus.APPROVED, 'approver1')).rejects.toThrow(BadRequestException);
        });

        it('should throw if rejecting without a reason', async () => {
            const pendingLeave = {
                id: 'lr1', status: LeaveRequestStatus.PENDING, type: LeaveRequestType.UNPAID,
                employeeId: 'e1', duration: 1, startDate: new Date(), endDate: new Date(),
            };
            const ds = buildTransactionMock({
                leaveRepoFindOne: jest.fn().mockResolvedValue(pendingLeave),
            });
            service = await buildService(ds);
            await expect(service.updateStatus('lr1', LeaveRequestStatus.REJECTED, 'approver1')).rejects.toThrow(BadRequestException);
        });
    });
});
