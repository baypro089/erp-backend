import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '@/services/order.service';
import { OrderRepository } from '@/repositories/order.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@libs/shared/enums/order-status.enum';
import { Customer } from '@/entities/customer.entity';
import { User } from '@/entities/user.entity';
import { Product } from '@/entities/product.entity';
import { ProductStock } from '@/entities/product-stock.entity';
import { Order } from '@/entities/order.entity';
import { OrderDetail } from '@/entities/order-detail.entity';
import { StockHistory } from '@/entities/stock-history.entity';
import { ProductSerial } from '@/entities/product-serial.entity';
import { Warehouse } from '@/entities/warehouse.entity';

const fakeOrder = {
    id: 'ord1', code: 'SO-001', status: OrderStatus.PENDING, totalAmount: 1000,
    customer: { id: 'cust1', totalSpent: 0 },
    items: [{ id: 'oi1', product: { id: 'prod1', hasSerialNumber: false }, quantity: 2, unitPrice: 500, assignedSerials: [] }]
};

const mockOrderRepo = {
    findAllFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), delByPrefix: jest.fn() };

function buildManagerMock(overrides: Record<string, any> = {}) {
    const resolve = (key: string, def: any) =>
        key in overrides ? overrides[key] : def;
    return {
        findOne: jest.fn().mockImplementation((entity: any) => {
            if (entity === Customer) return Promise.resolve(resolve('customer', { id: 'cust1', totalSpent: 0 }));
            if (entity === User) return Promise.resolve(resolve('user', { id: 'u1' }));
            if (entity === Product) return Promise.resolve(resolve('product', { id: 'prod1', name: 'Laptop', hasSerialNumber: false }));
            if (entity === Order) return Promise.resolve(resolve('order', fakeOrder));
            if (entity === ProductStock) return Promise.resolve(resolve('stock', { quantity: 10 }));
            if (entity === Warehouse) return Promise.resolve(resolve('warehouse', { id: 'wh1' }));
            return Promise.resolve({});
        }),
        create: jest.fn().mockImplementation((_entity: any, data: any) => data ?? {}),
        save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: entity?.id || 'saved' })),
        update: jest.fn().mockResolvedValue(undefined),
        createQueryBuilder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ sum: 10, total: 10 }),
            getMany: jest.fn().mockResolvedValue([]),
        }),
    };
}

describe('OrderService', () => {
    let service: OrderService;

    const buildService = async (dsOverride?: any) => {
        const ds = dsOverride ?? {
            transaction: jest.fn((cb: any) => cb(buildManagerMock())),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrderService,
                { provide: OrderRepository, useValue: mockOrderRepo },
                { provide: DataSource, useValue: ds },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        return module.get<OrderService>(OrderService);
    };

    beforeEach(() => jest.clearAllMocks());

    describe('createOrder', () => {
        it('should throw if customer not found', async () => {
            service = await buildService({
                transaction: jest.fn((cb: any) => cb(buildManagerMock({ customer: null }))),
            });
            await expect(service.createOrder('u1', {
                customerId: 'ghost', items: [{ productId: 'prod1', quantity: 1, unitPrice: 100 }], discountAmount: 0,
            } as any)).rejects.toThrow(NotFoundException);
        });

        it('should throw if insufficient stock', async () => {
            const mgr = buildManagerMock();
            mgr.createQueryBuilder = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ sum: 0 }),
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            await expect(service.createOrder('u1', {
                customerId: 'cust1', items: [{ productId: 'prod1', quantity: 5, unitPrice: 100 }], discountAmount: 0,
            } as any)).rejects.toThrow(BadRequestException);
        });

        it('should create order successfully', async () => {
            const mgr = buildManagerMock();
            // findOne for Order after save
            let orderSaveCount = 0;
            mgr.save = jest.fn().mockImplementation(() => {
                orderSaveCount++;
                return Promise.resolve({ ...fakeOrder, id: 'ord1' });
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            const result = await service.createOrder('u1', {
                customerId: 'cust1', items: [{ productId: 'prod1', quantity: 2, unitPrice: 500 }], discountAmount: 0,
            } as any);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('orders:list:');
        });
    });

    describe('getAllOrdersWithFiltersAndPagination', () => {
        it('should return cached result on cache hit', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue({ items: [fakeOrder], total: 1 });
            const result = await service.getAllOrdersWithFiltersAndPagination();
            expect(result.total).toBe(1);
        });

        it('should fetch and cache on miss', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeOrder], total: 1 };
            mockOrderRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            const result = await service.getAllOrdersWithFiltersAndPagination();
            expect(result).toEqual(paged);
        });
    });

    describe('getOrderById', () => {
        it('should return cached order', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(fakeOrder);
            const result = await service.getOrderById('ord1');
            expect(result).toEqual(fakeOrder);
        });

        it('should fetch and cache on miss', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            mockOrderRepo.findOne.mockResolvedValue(fakeOrder);
            const result = await service.getOrderById('ord1');
            expect(result).toEqual(fakeOrder);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('updateOrderStatus', () => {
        it('should throw if order not found', async () => {
            service = await buildService({ transaction: jest.fn((cb: any) => cb(buildManagerMock({ order: null }))) });
            await expect(service.updateOrderStatus('u1', 'ghost', OrderStatus.CANCELLED)).rejects.toThrow(BadRequestException);
        });

        it('should cancel a PENDING order', async () => {
            const pendingOrder = { ...fakeOrder, status: OrderStatus.PENDING };
            const mgr = buildManagerMock({ order: pendingOrder });
            mgr.save = jest.fn().mockResolvedValue({ ...pendingOrder, status: OrderStatus.CANCELLED });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            await expect(service.updateOrderStatus('u1', 'ord1', OrderStatus.CANCELLED)).resolves.not.toThrow();
        });
    });
});
