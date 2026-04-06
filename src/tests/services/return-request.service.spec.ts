import { Test, TestingModule } from '@nestjs/testing';
import { ReturnService } from '@/services/return-request.service';
import { ReturnRequestRepository } from '@/repositories/return-request.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReturnStatus } from '@libs/shared/enums/return-status.enum';
import { OrderStatus } from '@libs/shared/enums/order-status.enum';
import { Order } from '@/entities/order.entity';
import { Warehouse } from '@/entities/warehouse.entity';
import { Product } from '@/entities/product.entity';
import { ProductStock } from '@/entities/product-stock.entity';
import { StockHistory } from '@/entities/stock-history.entity';
import { ProductSerial } from '@/entities/product-serial.entity';
import { ReturnRequest } from '@/entities/return-request.entity';
import { ReturnItem } from '@/entities/return-item.entity';

const fakeOrder = {
    id: 'ord1', code: 'SO-001', customer: { id: 'cust1', totalSpent: 1000 },
    items: [{ id: 'oi1', product: { id: 'prod1', name: 'Laptop', hasSerialNumber: false }, quantity: 2 }],
    status: OrderStatus.DELIVERED,
    creator: { id: 'u1', role: {} },
};
const fakeWarehouse = { id: 'wh1', name: 'WH1' };
const fakeProduct = { id: 'prod1', hasSerialNumber: false };
const fakeReturnRequest = { id: 'rr1', code: 'RMA-001', status: ReturnStatus.COMPLETED };

const mockReturnRepo = {
    findAllFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

function buildManager() {
    const mgr: any = {
        findOne: jest.fn().mockImplementation((entity: any) => {
            if (entity === Order) return Promise.resolve(fakeOrder);
            if (entity === Warehouse) return Promise.resolve(fakeWarehouse);
            if (entity === Product) return Promise.resolve(fakeProduct);
            if (entity === ProductStock) return Promise.resolve({ quantity: 5 });
            if (entity === ReturnRequest) return Promise.resolve(fakeReturnRequest);
            return Promise.resolve({});
        }),
        create: jest.fn().mockImplementation((_, data) => ({ ...data, id: 'new' })),
        save: jest.fn().mockImplementation((e) => Promise.resolve({ ...e, id: e.id || 'saved' })),
        update: jest.fn().mockResolvedValue(undefined),
        createQueryBuilder: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ total: 5 }),
            getRawMany: jest.fn().mockResolvedValue([]),
            getMany: jest.fn().mockResolvedValue([]),
        }),
    };
    return mgr;
}

describe('ReturnService', () => {
    let service: ReturnService;

    const buildService = async (dsOverride?: any) => {
        const ds = dsOverride ?? { transaction: jest.fn((cb: any) => cb(buildManager())) };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReturnService,
                { provide: ReturnRequestRepository, useValue: mockReturnRepo },
                { provide: DataSource, useValue: ds },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        return module.get<ReturnService>(ReturnService);
    };

    beforeEach(() => jest.clearAllMocks());

    describe('processReturn', () => {
        it('should throw if order not found', async () => {
            const mgr = buildManager();
            mgr.findOne = jest.fn().mockImplementation((entity: any) => {
                if (entity === Order) return Promise.resolve(null);
                return Promise.resolve({});
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            await expect(service.processReturn('u1', { orderId: 'ghost', warehouseId: 'wh1', reason: 'r', items: [] } as any)).rejects.toThrow(NotFoundException);
        });

        it('should throw if product not in order', async () => {
            const mgr = buildManager();
            mgr.findOne = jest.fn().mockImplementation((entity: any) => {
                if (entity === Order) return Promise.resolve(fakeOrder);
                if (entity === Warehouse) return Promise.resolve(fakeWarehouse);
                if (entity === Product) return Promise.resolve({ id: 'other-prod', hasSerialNumber: false });
                return Promise.resolve({});
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            await expect(service.processReturn('u1', {
                orderId: 'ord1', warehouseId: 'wh1', reason: 'broken',
                items: [{ productId: 'other-prod', quantity: 1 }],
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw if order is not delivered', async () => {
            const mgr = buildManager();
            mgr.findOne = jest.fn().mockImplementation((entity: any) => {
                if (entity === Order) {
                    return Promise.resolve({ ...fakeOrder, status: OrderStatus.SHIPPED });
                }
                if (entity === Warehouse) return Promise.resolve(fakeWarehouse);
                return Promise.resolve({});
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });

            await expect(service.processReturn('u1', {
                orderId: 'ord1', warehouseId: 'wh1', reason: 'broken',
                items: [{ productId: 'prod1', quantity: 1, refundPrice: 500 }],
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should process return successfully', async () => {
            service = await buildService();
            const result = await service.processReturn('u1', {
                orderId: 'ord1', warehouseId: 'wh1', reason: 'broken',
                items: [{ productId: 'prod1', quantity: 1, refundPrice: 500 }],
            } as any);
            expect(mockRedis.delByPrefix).toHaveBeenCalled();
        });
    });

    describe('getAllReturns', () => {
        it('should return cached result on hit', async () => {
            service = await buildService();
            const cached = { items: [fakeReturnRequest], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.getAllReturns();
            expect(result).toEqual(cached);
        });

        it('should fetch and cache on miss', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeReturnRequest], total: 1 };
            mockReturnRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            expect(await service.getAllReturns()).toEqual(paged);
        });
    });

    describe('getReturnRequestById', () => {
        it('should throw if not found', async () => {
            service = await buildService();
            mockReturnRepo.findOne.mockResolvedValue(null);
            await expect(service.getReturnRequestById('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should return return request', async () => {
            service = await buildService();
            mockReturnRepo.findOne.mockResolvedValue(fakeReturnRequest);
            const result = await service.getReturnRequestById('rr1');
            expect(result).toEqual(fakeReturnRequest);
        });
    });
});
