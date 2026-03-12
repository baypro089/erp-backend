import { Test, TestingModule } from '@nestjs/testing';
import { ProductStockService } from '@/services/product-stock.service';
import { ProductStockRepository } from '@/repositories/product-stock.repository';
import { StockHistoryRepository } from '@/repositories/stock-history.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { StockChangeType } from '@libs/shared/enums/warehouse-type.enum';
import { ProductStock } from '@/entities/product-stock.entity';
import { Product } from '@/entities/product.entity';
import { StockHistory } from '@/entities/stock-history.entity';

const fakeStock = { id: 'ps1', quantity: 10, warehouse: { id: 'wh1' }, product: { id: 'prod1' } };

const mockStockRepo = { findAllFilteredAndPaged: jest.fn() };
const mockHistoryRepo = { findAllByProductAndWarehouse: jest.fn() };
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

const NO_STOCK = Symbol('NO_STOCK');

function buildManagerMock(stockOverride?: any) {
    const stockValue = stockOverride === NO_STOCK || stockOverride === undefined ? fakeStock : stockOverride;
    return {
        findOne: jest.fn().mockResolvedValue(stockValue),
        create: jest.fn().mockImplementation((_entity: any, data: any) => ({ ...data, quantity: data?.quantity ?? 0 })),
        save: jest.fn().mockImplementation((entity: any) => {
            if (entity && entity.quantity !== undefined) return Promise.resolve(entity);
            return Promise.resolve({ id: 'hist1' });
        }),
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ total: 10 }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
    };
}

describe('ProductStockService', () => {
    let service: ProductStockService;
    let mockDataSource: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockDataSource = { transaction: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductStockService,
                { provide: ProductStockRepository, useValue: mockStockRepo },
                { provide: StockHistoryRepository, useValue: mockHistoryRepo },
                { provide: RedisService, useValue: mockRedis },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<ProductStockService>(ProductStockService);
    });

    describe('updateStock', () => {
        it('should throw if trying to deduct from non-existent stock', async () => {
            // Pass false explicitly to signal that findOne should return null (no existing stock)
            const manager = buildManagerMock(false);
            manager.findOne = jest.fn().mockResolvedValue(null);
            await expect(service.updateStock(manager, 'wh1', 'prod1', -5, StockChangeType.EXPORT, 'REF-01', 'user1', 'reason')).rejects.toThrow(BadRequestException);
        });

        it('should throw if stock goes negative', async () => {
            const manager = buildManagerMock({ ...fakeStock, quantity: 3 });
            await expect(service.updateStock(manager, 'wh1', 'prod1', -5, StockChangeType.EXPORT, 'REF-01', 'user1', 'reason')).rejects.toThrow(BadRequestException);
        });

        it('should update stock and record history', async () => {
            const manager = buildManagerMock({ ...fakeStock, quantity: 10 });
            const result = await service.updateStock(manager, 'wh1', 'prod1', 5, StockChangeType.IMPORT, 'REF-01', 'user1', 'Import');
            expect(result.quantity).toBe(15);
        });
    });

    describe('manualAdjust', () => {
        it('should call updateStock inside a transaction', async () => {
            const manager = buildManagerMock({ ...fakeStock, quantity: 5 });
            mockDataSource.transaction = jest.fn((cb: any) => cb(manager));
            const result = await service.manualAdjust('user1', {
                warehouseId: 'wh1', productId: 'prod1', delta: 3, reason: 'test',
            } as any);
            expect(result.quantity).toBe(8);
        });
    });

    describe('findAllFilteredAndPaged', () => {
        it('should return cached result on hit', async () => {
            const cached = { items: [fakeStock], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllFilteredAndPaged('wh1');
            expect(result).toEqual(cached);
        });

        it('should fetch and cache on miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeStock], total: 1 };
            mockStockRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            expect(await service.findAllFilteredAndPaged('wh1')).toEqual(paged);
        });
    });
});
