import { Test, TestingModule } from '@nestjs/testing';
import { HrStatisticService } from '@/services/hr-statistic.service';
import { DataSource } from 'typeorm';
import { LeaveRequestStatus } from '@libs/shared/enums/leave-request-status.enum';
import { Status } from '@libs/shared/enums/employee-status.enum';

const mockCreateQueryBuilder = (getCountValue = 0, getRawManyValue: any[] = []) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(getCountValue),
    getRawMany: jest.fn().mockResolvedValue(getRawManyValue),
});

describe('HrStatisticService', () => {
    let service: HrStatisticService;
    let mockDataSource: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const empRepo = {
            count: jest.fn().mockResolvedValue(50),
            createQueryBuilder: jest.fn().mockReturnValue(mockCreateQueryBuilder(5, [{ departmentName: 'Engineering', count: '25' }])),
        };

        const leaveRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockCreateQueryBuilder(3)),
            count: jest.fn().mockResolvedValue(7),
        };

        const payslipRepo = {
            createQueryBuilder: jest.fn().mockReturnValue({
                ...mockCreateQueryBuilder(0, [
                    { isPaid: true, total: '50000' },
                    { isPaid: false, total: '20000' },
                ]),
            }),
        };

        mockDataSource = {
            getRepository: jest.fn((entity) => {
                const name = entity?.name || '';
                if (name === 'Employee') return empRepo;
                if (name === 'LeaveRequest') return leaveRepo;
                if (name === 'Payslip') return payslipRepo;
                return {};
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HrStatisticService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<HrStatisticService>(HrStatisticService);
    });

    describe('getDashboard', () => {
        it('should return dashboard data with headcount, attendance, payroll, and department distribution', async () => {
            const result = await service.getDashboard({ month: '2026-03' });
            expect(result).toHaveProperty('headcount');
            expect(result).toHaveProperty('attendance');
            expect(result).toHaveProperty('payroll');
            expect(result).toHaveProperty('departmentDistribution');
        });

        it('should work without month filter', async () => {
            const result = await service.getDashboard({});
            expect(result).toHaveProperty('headcount');
        });

        it('should calculate totalEstimated as sum of paid + unpaid', async () => {
            const result = await service.getDashboard({ month: '2026-01' });
            // totalPaid = 50000, totalEstimated = 50000 + 20000 = 70000
            expect(result.payroll.totalPaid).toBe(50000);
            expect(result.payroll.totalEstimated).toBe(70000);
        });
    });
});
