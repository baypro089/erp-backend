import { Test, TestingModule } from '@nestjs/testing';
import { HrReportService } from '@/services/hr-report.service';
import { DataSource } from 'typeorm';

const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
};

describe('HrReportService', () => {
    let service: HrReportService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const mockDataSource = {
            getRepository: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue(10),
                createQueryBuilder: jest.fn().mockReturnValue(qb),
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HrReportService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<HrReportService>(HrReportService);
    });

    describe('getManagerReport', () => {
        it('should return report structure with headcount, payrollSummary and payrollDetails', async () => {
            const result = await service.getManagerReport({ year: 2026, month: 3 });
            expect(result).toHaveProperty('period');
            expect(result).toHaveProperty('headcount');
            expect(result.headcount).toHaveProperty('totalActive');
            expect(result.headcount).toHaveProperty('newHires');
            expect(result.headcount).toHaveProperty('resigned');
            expect(result).toHaveProperty('payrollSummary');
            expect(result).toHaveProperty('payrollDetails');
        });

        it('should default to current year if year not provided', async () => {
            const result = await service.getManagerReport({});
            expect(result.period).toContain(String(new Date().getFullYear()));
        });

        it('should include month in period string when month is provided', async () => {
            const result = await service.getManagerReport({ year: 2026, month: 2 });
            expect(result.period).toContain('2');
        });
    });
});
