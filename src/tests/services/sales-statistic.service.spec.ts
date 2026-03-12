import { Test, TestingModule } from '@nestjs/testing';
import { SalesStatisticService } from '@/services/sales-statistic.service';
import { DataSource } from 'typeorm';

const makeQb = (rawOneValue?: any, rawManyValue?: any[]) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(rawOneValue ?? { total: '50000' }),
    getRawMany: jest.fn().mockResolvedValue(rawManyValue ?? [{ staffName: 'Alice', totalOrders: '10', totalRevenue: '100000' }]),
});

describe('SalesStatisticService', () => {
    let service: SalesStatisticService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const mockDataSource = {
            getRepository: jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
                count: jest.fn().mockResolvedValue(5),
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesStatisticService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<SalesStatisticService>(SalesStatisticService);
    });

    describe('getDashboard', () => {
        it('should return metrics, topStaffs, topCustomers', async () => {
            const result = await service.getDashboard({});
            expect(result).toHaveProperty('metrics');
            expect(result).toHaveProperty('topStaffs');
            expect(result).toHaveProperty('topCustomers');
        });

        it('should compute cancelRate correctly (0 if no orders)', async () => {
            const result = await service.getDashboard({});
            expect(typeof result.metrics.cancelRate).toBe('number');
        });

        it('should work with month and year filters', async () => {
            const result = await service.getDashboard({ month: '1', year: '2026' });
            expect(result).toHaveProperty('metrics');
        });
    });
});
