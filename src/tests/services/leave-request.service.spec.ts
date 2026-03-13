import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestService } from '@/services/leave-request.service';
import { LeaveRequestRepository } from '@/repositories/leave-request.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { LeaveRequestStatus, LeaveRequestType } from '@libs/shared/enums/leave-request-status.enum';
import { Status } from '@libs/shared/enums/employee-status.enum';
import { Employee } from '@/entities/employee.entity';
import { Holiday } from '@/entities/holiday.entity';
import { LeaveRequest } from '@/entities/leave-request.entity';

const mockLeaveRepo = {
    findAll: jest.fn(),
    findAllByUserId: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

interface TransactionMockOverrides {
    employeeFindOne?: jest.Mock;
    holidayFind?: jest.Mock;
    leaveOverlap?: jest.Mock;
    leaveGetMany?: jest.Mock;
    leaveRepoFindOne?: jest.Mock;
    employeeUpdate?: jest.Mock;
    topLevelLeaveRepo?: {
        findOne: jest.Mock;
        save: jest.Mock;
    };
}

function buildTransactionMock(overrides: TransactionMockOverrides = {}) {
    const employeeFindOne = overrides.employeeFindOne ?? jest.fn().mockResolvedValue({
        id: 'e1', totalAnnualLeave: 12, usedAnnualLeave: 0,
    });
    const holidayFind = overrides.holidayFind ?? jest.fn().mockResolvedValue([]);
    const leaveOverlap = overrides.leaveOverlap ?? jest.fn().mockResolvedValue(null);
    const employeeUpdate = overrides.employeeUpdate ?? jest.fn().mockResolvedValue({});

    const leaveRepo = {
        create: jest.fn().mockReturnValue({ id: 'lr1', status: LeaveRequestStatus.PENDING }),
        save: jest.fn().mockResolvedValue({ id: 'lr1', status: LeaveRequestStatus.PENDING }),
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: leaveOverlap,
            getMany: overrides.leaveGetMany ?? jest.fn().mockResolvedValue([]),
        }),
        findOne: overrides.leaveRepoFindOne ?? jest.fn().mockResolvedValue(null),
    };

    const topLevelLeaveRepo = overrides.topLevelLeaveRepo ?? {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({ id: 'lr1', isBhxhClaimed: true }),
    };

    return {
        transaction: jest.fn((cb: any) => cb({
            getRepository: (entity: any) => {
                if (entity === Employee) return { findOne: employeeFindOne, update: employeeUpdate };
                if (entity === Holiday) return { find: holidayFind };
                if (entity === LeaveRequest) return leaveRepo;
                return {
                    findOne: jest.fn(),
                    save: jest.fn(),
                    createQueryBuilder: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnThis(),
                        andWhere: jest.fn().mockReturnThis(),
                        getOne: jest.fn().mockResolvedValue(null),
                        getMany: jest.fn().mockResolvedValue([]),
                    }),
                };
            },
        })),
        getRepository: (entity: any) => {
            if (entity === LeaveRequest) return topLevelLeaveRepo;
            return { findOne: jest.fn() };
        },
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

    // ─── create ───────────────────────────────────────────────────────────────
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

        // MATERNITY tests
        it('should throw if maternity leave has no documentUrl', async () => {
            const ds = buildTransactionMock();
            service = await buildService(ds);
            await expect(service.create('u1', {
                startDate: '2026-04-01',
                type: LeaveRequestType.MATERNITY,
                reason: 'sinh con',
                // missing documentUrl
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should auto-calculate endDate as startDate + 179 days for maternity leave', async () => {
            const leaveRepoCreate = jest.fn().mockImplementation((data: any) => data);
            const leaveRepoSave = jest.fn().mockImplementation((data: any) =>
                Promise.resolve({ ...data, id: 'lr-mat' })
            );
            const ds = buildTransactionMock();
            // Override leaveRepo inside transaction
            (ds.transaction as jest.Mock).mockImplementation((cb: any) => cb({
                getRepository: (entity: any) => {
                    if (entity === Employee) return { findOne: jest.fn().mockResolvedValue({ id: 'e1', totalAnnualLeave: 12, usedAnnualLeave: 0 }) };
                    if (entity === Holiday) return { find: jest.fn().mockResolvedValue([]) };
                    if (entity === LeaveRequest) return {
                        create: leaveRepoCreate,
                        save: leaveRepoSave,
                        createQueryBuilder: jest.fn().mockReturnValue({
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            getOne: jest.fn().mockResolvedValue(null),
                            getMany: jest.fn().mockResolvedValue([]),
                        }),
                    };
                    return { findOne: jest.fn(), save: jest.fn() };
                },
            }));

            service = await buildService(ds);
            const startDate = '2026-04-01';
            await service.create('u1', {
                startDate,
                type: LeaveRequestType.MATERNITY,
                reason: 'sinh con',
                documentUrl: 'https://example.com/doc.pdf',
            } as any);

            const createdData = leaveRepoCreate.mock.calls[0][0];
            const expectedEnd = new Date('2026-04-01');
            expectedEnd.setDate(expectedEnd.getDate() + 179);
            expect(new Date(createdData.endDate).toDateString()).toBe(expectedEnd.toDateString());
        });

        it('should create maternity leave successfully with documentUrl', async () => {
            const ds = buildTransactionMock();
            let savedData: any;
            (ds.transaction as jest.Mock).mockImplementation((cb: any) => cb({
                getRepository: (entity: any) => {
                    if (entity === Employee) return { findOne: jest.fn().mockResolvedValue({ id: 'e1', totalAnnualLeave: 12, usedAnnualLeave: 0 }) };
                    if (entity === Holiday) return { find: jest.fn().mockResolvedValue([]) };
                    if (entity === LeaveRequest) return {
                        create: jest.fn().mockImplementation((d: any) => d),
                        save: jest.fn().mockImplementation((d: any) => { savedData = { ...d, id: 'lr-mat' }; return Promise.resolve(savedData); }),
                        createQueryBuilder: jest.fn().mockReturnValue({
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            getOne: jest.fn().mockResolvedValue(null),
                        }),
                    };
                    return { findOne: jest.fn(), save: jest.fn() };
                },
            }));

            service = await buildService(ds);
            const result = await service.create('u1', {
                startDate: '2026-04-01',
                type: LeaveRequestType.MATERNITY,
                reason: 'sinh con',
                documentUrl: 'https://example.com/doc.pdf',
            } as any);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('documentUrl', 'https://example.com/doc.pdf');
        });

        it('should throw if non-maternity leave has no endDate', async () => {
            const ds = buildTransactionMock();
            service = await buildService(ds);
            await expect(service.create('u1', {
                startDate: '2026-04-01',
                type: LeaveRequestType.UNPAID,
                reason: 'nghỉ việc',
                // missing endDate
            } as any)).rejects.toThrow(BadRequestException);
        });
    });

    // ─── findAllWithFilteredAndPaged ──────────────────────────────────────────
    describe('findAllWithFilteredAndPaged', () => {
        it('should return cached result on cache hit', async () => {
            const ds = buildTransactionMock();
            // Also mock top-level getRepository for User
            (ds as any).getRepository = (entity: any) => {
                if (entity.name === 'User') return { findOne: jest.fn().mockResolvedValue({ role: { permissions: [{ permission_code: 'ADMIN' }] } }) };
                return { findOne: jest.fn().mockResolvedValue(null) };
            };
            service = await buildService(ds);
            const cached = { items: [], total: 0 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllWithFilteredAndPaged('u1');
            expect(result).toEqual(cached);
            expect(mockLeaveRepo.findAll).not.toHaveBeenCalled();
        });

        it('should fetch and cache on miss', async () => {
            const ds = buildTransactionMock();
            (ds as any).getRepository = (entity: any) => {
                if (entity.name === 'User') return { findOne: jest.fn().mockResolvedValue({ role: { permissions: [{ permission_code: 'ADMIN' }] } }) };
                return { findOne: jest.fn().mockResolvedValue(null) };
            };
            service = await buildService(ds);
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [{ id: 'lr1' }], total: 1 };
            mockLeaveRepo.findAll.mockResolvedValue(paged);
            const result = await service.findAllWithFilteredAndPaged('u1');
            expect(result).toEqual(paged);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    // ─── updateStatus ─────────────────────────────────────────────────────────
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

    // ─── processMaternityLeave ────────────────────────────────────────────────
    describe('processMaternityLeave', () => {
        it('should update employee to MATERNITY_LEAVE when startDate == today', async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const maternityLeave = {
                id: 'lr-mat', employeeId: 'e1',
                type: LeaveRequestType.MATERNITY,
                status: LeaveRequestStatus.APPROVED,
                startDate: today,
                endDate: new Date(today.getTime() + 179 * 86400000),
            };

            const employeeUpdate = jest.fn().mockResolvedValue({});
            // First getMany = startingToday, second getMany = endingYesterday
            let callCount = 0;
            const getMany = jest.fn().mockImplementation(() => {
                callCount++;
                return callCount === 1 ? Promise.resolve([maternityLeave]) : Promise.resolve([]);
            });

            const ds = buildTransactionMock({ employeeUpdate, leaveGetMany: getMany });
            service = await buildService(ds);
            await service.processMaternityLeave();

            expect(employeeUpdate).toHaveBeenCalledWith('e1', { status: Status.MATERNITY_LEAVE });
        });

        it('should update employee to ACTIVE when endDate == yesterday', async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const maternityLeave = {
                id: 'lr-mat', employeeId: 'e1',
                type: LeaveRequestType.MATERNITY,
                status: LeaveRequestStatus.APPROVED,
                endDate: yesterday,
            };

            const employeeUpdate = jest.fn().mockResolvedValue({});
            let callCount = 0;
            const getMany = jest.fn().mockImplementation(() => {
                callCount++;
                return callCount === 1 ? Promise.resolve([]) : Promise.resolve([maternityLeave]);
            });

            const ds = buildTransactionMock({ employeeUpdate, leaveGetMany: getMany });
            service = await buildService(ds);
            await service.processMaternityLeave();

            expect(employeeUpdate).toHaveBeenCalledWith('e1', { status: Status.ACTIVE });
        });

        it('should not update any employee when no maternity leaves match', async () => {
            const employeeUpdate = jest.fn().mockResolvedValue({});
            const ds = buildTransactionMock({ employeeUpdate });
            service = await buildService(ds);
            await service.processMaternityLeave();

            expect(employeeUpdate).not.toHaveBeenCalled();
        });
    });

    // ─── claimBhxh ────────────────────────────────────────────────────────────
    describe('claimBhxh', () => {
        it('should throw if leave request not found', async () => {
            const ds = buildTransactionMock({
                topLevelLeaveRepo: { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() },
            });
            service = await buildService(ds);
            await expect(service.claimBhxh('lr-unknown')).rejects.toThrow(BadRequestException);
        });

        it('should throw if leave type is not MATERNITY', async () => {
            const leave = { id: 'lr1', type: LeaveRequestType.ANNUAL, status: LeaveRequestStatus.APPROVED, isBhxhClaimed: false };
            const ds = buildTransactionMock({
                topLevelLeaveRepo: { findOne: jest.fn().mockResolvedValue(leave), save: jest.fn() },
            });
            service = await buildService(ds);
            await expect(service.claimBhxh('lr1')).rejects.toThrow(BadRequestException);
        });

        it('should throw if leave is not APPROVED', async () => {
            const leave = { id: 'lr1', type: LeaveRequestType.MATERNITY, status: LeaveRequestStatus.PENDING, isBhxhClaimed: false };
            const ds = buildTransactionMock({
                topLevelLeaveRepo: { findOne: jest.fn().mockResolvedValue(leave), save: jest.fn() },
            });
            service = await buildService(ds);
            await expect(service.claimBhxh('lr1')).rejects.toThrow(BadRequestException);
        });

        it('should throw if BHXH already claimed', async () => {
            const leave = { id: 'lr1', type: LeaveRequestType.MATERNITY, status: LeaveRequestStatus.APPROVED, isBhxhClaimed: true };
            const ds = buildTransactionMock({
                topLevelLeaveRepo: { findOne: jest.fn().mockResolvedValue(leave), save: jest.fn() },
            });
            service = await buildService(ds);
            await expect(service.claimBhxh('lr1')).rejects.toThrow(BadRequestException);
        });

        it('should set isBhxhClaimed to true on success', async () => {
            const leave = {
                id: 'lr1', type: LeaveRequestType.MATERNITY,
                status: LeaveRequestStatus.APPROVED, isBhxhClaimed: false,
            };
            const savedLeave = { ...leave, isBhxhClaimed: true };
            const saveMock = jest.fn().mockResolvedValue(savedLeave);
            const ds = buildTransactionMock({
                topLevelLeaveRepo: { findOne: jest.fn().mockResolvedValue(leave), save: saveMock },
            });
            service = await buildService(ds);
            const result = await service.claimBhxh('lr1');

            expect(saveMock).toHaveBeenCalled();
            expect(result.isBhxhClaimed).toBe(true);
        });
    });
});
