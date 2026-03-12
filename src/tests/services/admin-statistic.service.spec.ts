import { Test, TestingModule } from '@nestjs/testing';
import { AdminStatisticService } from '@/services/admin-statistic.service';
import { DataSource } from 'typeorm';

const makeQb = (rawOneValue?: any, rawManyValue?: any[], countValue?: number) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(rawOneValue ?? { total: '100000' }),
    getRawMany: jest.fn().mockResolvedValue(rawManyValue ?? []),
    getCount: jest.fn().mockResolvedValue(countValue ?? 5),
});

describe('AdminStatisticService', () => {
    let service: AdminStatisticService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const mockDataSource = {
            getRepository: jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(makeQb({ total: '500000' }, [
                    { status: 'PENDING', count: '10' },
                    { status: 'DELIVERED', count: '50' },
                ])),
                count: jest.fn().mockResolvedValue(3),
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminStatisticService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<AdminStatisticService>(AdminStatisticService);
    });

    describe('getMasterDashboard', () => {
        it('should return dashboard with overview, orderStats, topProducts, lowStockAlerts', async () => {
            const result = await service.getMasterDashboard({});
            expect(result).toHaveProperty('overview');
            expect(result).toHaveProperty('orderStats');
            expect(result).toHaveProperty('topProducts');
            expect(result).toHaveProperty('lowStockAlerts');
        });

        it('should calculate grossProfit from totalRevenue - totalCost', async () => {
            const result = await service.getMasterDashboard({ fromDate: '2026-01-01', toDate: '2026-03-31' });
            expect(result.overview.grossProfit).toBe(result.overview.totalRevenue - result.overview.totalCost);
        });

        it('should work without date filters using defaults', async () => {
            const result = await service.getMasterDashboard({});
            expect(result).toHaveProperty('overview');
        });
    });
});
