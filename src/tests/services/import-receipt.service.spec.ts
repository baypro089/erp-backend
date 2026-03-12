import { Test, TestingModule } from '@nestjs/testing';
import { ImportReceiptService } from '@/services/import-receipt.service';
import { ImportReceiptRepository } from '@/repositories/import-receipt.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ImportReceipt } from '@/entities/import-receipt.entity';
import { Product } from '@/entities/product.entity';
import { ImportDetail } from '@/entities/import-detail.entity';
import { Warehouse } from '@/entities/warehouse.entity';
import { ProductStock } from '@/entities/product-stock.entity';
import { StockHistory } from '@/entities/stock-history.entity';
import { ProductSerial } from '@/entities/product-serial.entity';

const mockImportRepo = {
    findAllWithFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

const fakeWarehouse = { id: 'wh1', name: 'WH1' };
const fakeProduct = { id: 'prod1', name: 'Laptop', hasSerialNumber: false };
const fakeReceipt = {
    id: 'ir1', code: 'PN-001', warehouse: fakeWarehouse,
    items: [{ product: fakeProduct, quantity: 5, unitPrice: 100, scannedSerials: [] }],
    createdByUser: { id: 'u1' },
};

function buildManagerMock() {
    const stockFindOne = jest.fn().mockResolvedValue(null);
    const stockCreate = jest.fn().mockImplementation((_, data) => ({ ...data, quantity: 0 }));
    const stockSave = jest.fn().mockImplementation((e) => Promise.resolve(e));
    const stockQb = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 5 }),
    };

    return {
        getRepository: jest.fn((entity) => {
            if (entity === Warehouse) return { findOne: jest.fn().mockResolvedValue(fakeWarehouse) };
            if (entity === Product) return {
                findOne: jest.fn().mockResolvedValue(fakeProduct),
                update: jest.fn(),
            };
            if (entity === ImportDetail) return { create: jest.fn().mockReturnValue({}) };
            if (entity === ImportReceipt) return {
                create: jest.fn().mockReturnValue(fakeReceipt),
                save: jest.fn().mockResolvedValue(fakeReceipt),
                findOne: jest.fn().mockResolvedValue(fakeReceipt),
            };
            if (entity === ProductStock) return {
                findOne: stockFindOne,
                create: stockCreate,
                save: stockSave,
                createQueryBuilder: jest.fn().mockReturnValue(stockQb),
            };
            if (entity === StockHistory) return {
                create: jest.fn().mockReturnValue({}),
                save: jest.fn().mockResolvedValue({}),
            };
            if (entity === ProductSerial) return {
                create: jest.fn().mockReturnValue({}),
                save: jest.fn().mockResolvedValue({}),
                createQueryBuilder: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                }),
            };
            return {};
        }),
    };
}

describe('ImportReceiptService', () => {
    let service: ImportReceiptService;

    const buildService = async (dsOverride?: any) => {
        const ds = dsOverride ?? {
            transaction: jest.fn((cb: any) => cb(buildManagerMock())),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImportReceiptService,
                { provide: ImportReceiptRepository, useValue: mockImportRepo },
                { provide: DataSource, useValue: ds },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        return module.get<ImportReceiptService>(ImportReceiptService);
    };

    beforeEach(() => jest.clearAllMocks());

    describe('createImportReceipt', () => {
        it('should throw if warehouse not found', async () => {
            const mgr = buildManagerMock();
            mgr.getRepository = jest.fn((entity) => {
                if (entity === Warehouse) return { findOne: jest.fn().mockResolvedValue(null) };
                return {};
            });
            service = await buildService({ transaction: jest.fn((cb: any) => cb(mgr)) });
            await expect(service.createImportReceipt('u1', {
                warehouseId: 'ghost', items: [],
            } as any)).rejects.toThrow(NotFoundException);
        });

        it('should create import receipt successfully', async () => {
            service = await buildService();
            const result = await service.createImportReceipt('u1', {
                warehouseId: 'wh1', items: [{ productId: 'prod1', quantity: 5, unitPrice: 100 }],
            } as any);
            expect(result).toHaveProperty('id');
        });
    });

    describe('getAllImportReceipts', () => {
        it('should return cached result on hit', async () => {
            service = await buildService();
            const cached = { items: [fakeReceipt], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.getAllImportReceipts();
            expect(result).toEqual(cached);
        });

        it('should fetch and cache on miss', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeReceipt], total: 1 };
            mockImportRepo.findAllWithFilteredAndPaged.mockResolvedValue(paged);
            expect(await service.getAllImportReceipts()).toEqual(paged);
        });
    });

    describe('getImportReceiptById', () => {
        it('should throw if not found', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            mockImportRepo.findOne.mockResolvedValue(null);
            await expect(service.getImportReceiptById('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should return receipt from cache', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(fakeReceipt);
            const result = await service.getImportReceiptById('ir1');
            expect(result).toEqual(fakeReceipt);
        });
    });
});
