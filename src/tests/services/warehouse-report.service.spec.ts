import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseReportService } from '@/services/warehouse-report.service';
import { DataSource } from 'typeorm';
import { Warehouse } from '@/entities/warehouse.entity';
import { Product } from '@/entities/product.entity';

const makeQb = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
        { sku: 'SKU001', productName: 'Laptop', hasSerialNumber: true, totalImported: '10', totalExported: '3', currentStock: '7' }
    ]),
});

describe('WarehouseReportService', () => {
    let service: WarehouseReportService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === Warehouse) return { findOne: jest.fn().mockResolvedValue({ name: 'Main Warehouse' }) };
                if (entity === Product) return { createQueryBuilder: jest.fn().mockReturnValue(makeQb()) };
                return {};
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WarehouseReportService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<WarehouseReportService>(WarehouseReportService);
    });

    describe('getProductStatistics', () => {
        it('should return period, warehouse name, and data array', async () => {
            const result = await service.getProductStatistics({ warehouseId: 'wh1', month: 3, year: 2026 });
            expect(result).toHaveProperty('period');
            expect(result).toHaveProperty('warehouse');
            expect(result).toHaveProperty('data');
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('should work without a warehouseId (all warehouses)', async () => {
            const result = await service.getProductStatistics({ month: 3, year: 2026 });
            expect(result.warehouse).toBe('Tất cả các kho');
        });

        it('should default to current month/year when not provided', async () => {
            const result = await service.getProductStatistics({});
            const today = new Date();
            expect(result.period).toContain(String(today.getFullYear()));
        });

        it('should format numbers correctly in data', async () => {
            const result = await service.getProductStatistics({ warehouseId: 'wh1' });
            if (result.data.length > 0) {
                expect(typeof result.data[0].totalImported).toBe('number');
                expect(typeof result.data[0].currentStock).toBe('number');
            }
        });
    });
});
