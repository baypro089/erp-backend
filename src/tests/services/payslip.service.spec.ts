import { Test, TestingModule } from '@nestjs/testing';
import { PayslipService } from '@/services/payslip.service';
import { PayslipRepository } from '@/repositories/payslip.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Status } from '@libs/shared/enums/employee-status.enum';
import { Employee } from '@/entities/employee.entity';
import { Payslip } from '@/entities/payslip.entity';
import { Holiday } from '@/entities/holiday.entity';
import { JobHistory } from '@/entities/job-history.entity';
import { ResignationRequest } from '@/entities/resignation-request.entity';
import { SystemSetting } from '@/entities/system-setting';
import { LeaveRequest } from '@/entities/leave-request.entity';

const fakeEmployee = { id: 'e1', fullName: 'Alice', status: Status.ACTIVE, remainingLeave: 2, user: { id: 'u1' } };
const fakePayslip = { id: 'ps1', employee: fakeEmployee, month: 3, year: 2026, isPaid: false, finalSalary: 5000 };
const fakeJob = { id: 'jh1', salaryAtTime: 10000000, isCurrent: true };

const mockPayslipRepo = {
    findOne: jest.fn(),
    findAllPayslipsFilteredAndPaged: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
};
const mockEmpRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

function buildManagerMock(overrides: Record<string, any> = {}) {
    return {
        getRepository: jest.fn((entity) => {
            if (entity === Holiday) return { find: jest.fn().mockResolvedValue([]) };
            if (entity === Payslip) return {
                findOne: overrides.payslipFindOne ?? jest.fn().mockResolvedValue(null),
                create: jest.fn().mockReturnValue(fakePayslip),
                save: jest.fn().mockResolvedValue(fakePayslip),
            };
            if (entity === Employee) return {
                findOne: overrides.employeeFindOne ?? jest.fn().mockResolvedValue(fakeEmployee),
            };
            if (entity === JobHistory) return {
                findOne: jest.fn().mockResolvedValue(fakeJob),
            };
            if (entity === ResignationRequest) return {
                findOne: jest.fn().mockResolvedValue(null),
            };
            if (entity === SystemSetting) return {
                find: jest.fn().mockResolvedValue([
                    { key: 'GLOBAL_LUNCH_AMOUNT', value: '500000', isActive: true },
                    { key: 'GLOBAL_TRANSPORT_AMOUNT', value: '300000', isActive: true },
                    { key: 'INSURANCE_RATE_PERCENT', value: '0.105', isActive: true },
                ]),
            };
            if (entity === LeaveRequest) return {
                createQueryBuilder: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                }),
            };
            return {};
        }),
    };
}

describe('PayslipService', () => {
    let service: PayslipService;

    const buildService = async (dsOverride?: any) => {
        const ds = dsOverride ?? {
            transaction: jest.fn((cb: any) => cb(buildManagerMock())),
            getRepository: jest.fn((entity) => {
                if (entity === LeaveRequest) return {
                    createQueryBuilder: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnThis(),
                        andWhere: jest.fn().mockReturnThis(),
                        getMany: jest.fn().mockResolvedValue([]),
                    }),
                };
                return {};
            }),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PayslipService,
                { provide: PayslipRepository, useValue: mockPayslipRepo },
                { provide: EmployeeRepository, useValue: mockEmpRepo },
                { provide: DataSource, useValue: ds },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        return module.get<PayslipService>(PayslipService);
    };

    beforeEach(() => jest.clearAllMocks());

    describe('calculatePayslip', () => {
        it('should throw if payslip already paid', async () => {
            const mgr = buildManagerMock({
                payslipFindOne: jest.fn().mockResolvedValue({ ...fakePayslip, isPaid: true }),
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            await expect(service.calculatePayslip('e1', 3, 2026)).rejects.toThrow(BadRequestException);
        });

        it('should throw if employee not found', async () => {
            const mgr = buildManagerMock({
                payslipFindOne: jest.fn().mockResolvedValue(null),
                employeeFindOne: jest.fn().mockResolvedValue(null),
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            await expect(service.calculatePayslip('ghost', 3, 2026)).rejects.toThrow(NotFoundException);
        });

        it('should calculate and save payslip', async () => {
            service = await buildService();
            const result = await service.calculatePayslip('e1', 3, 2026);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('finalSalary');
        });
    });

    describe('findAllPayslips', () => {
        it('should return cached result', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue({ items: [fakePayslip], total: 1 });
            const result = await service.findAllPayslips(3, 2026);
            expect(result.total).toBe(1);
        });

        it('should fetch and cache on miss', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            mockPayslipRepo.findAllPayslipsFilteredAndPaged.mockResolvedValue({ items: [fakePayslip], total: 1 });
            const result = await service.findAllPayslips(3, 2026);
            expect(result.total).toBe(1);
        });
    });

    describe('markPayslipAsPaid', () => {
        it('should throw if payslip not found', async () => {
            service = await buildService();
            mockPayslipRepo.findOne.mockResolvedValue(null);
            await expect(service.markPayslipAsPaid('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should mark payslip as paid and invalidate caches', async () => {
            service = await buildService();
            mockPayslipRepo.findOne.mockResolvedValue({ ...fakePayslip, employeeId: 'e1' });
            mockPayslipRepo.save.mockResolvedValue({ ...fakePayslip, isPaid: true });
            const result = await service.markPayslipAsPaid('ps1');
            expect(result.isPaid).toBe(true);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('payslips:all:');
        });
    });

    describe('getMyPayslips', () => {
        it('should throw if employee not found for user', async () => {
            service = await buildService();
            mockEmpRepo.findOne.mockResolvedValue(null);
            await expect(service.getMyPayslips('u1')).rejects.toThrow(NotFoundException);
        });

        it('should return filtered payslips for employee', async () => {
            service = await buildService();
            mockEmpRepo.findOne.mockResolvedValue(fakeEmployee);
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [{ ...fakePayslip, employee: fakeEmployee }], total: 1 };
            mockPayslipRepo.findAllPayslipsFilteredAndPaged.mockResolvedValue(paged);
            const result = await service.getMyPayslips('u1');
            expect(result.items.length).toBe(1);
        });
    });

    describe('getPayslipById', () => {
        it('should throw if not found', async () => {
            service = await buildService();
            mockPayslipRepo.findOne.mockResolvedValue(null);
            await expect(service.getPayslipById('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should return payslip', async () => {
            service = await buildService();
            mockPayslipRepo.findOne.mockResolvedValue(fakePayslip);
            const result = await service.getPayslipById('ps1');
            expect(result).toEqual(fakePayslip);
        });
    });
});
