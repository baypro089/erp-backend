import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from '@/services/supplier.service';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { RedisService } from '@/services/redis.service';
import { NotFoundException } from '@nestjs/common';

const mockSupplierRepo = {
    findAllFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };
const fakeSupplier = { id: 's1', name: 'ACME Corp', contactPhone: '123456' };

describe('SupplierService', () => {
    let service: SupplierService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SupplierService,
                { provide: SupplierRepository, useValue: mockSupplierRepo },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get<SupplierService>(SupplierService);
    });

    describe('findAllFilteredAndPaged', () => {
        it('should return from cache on hit', async () => {
            const cached = { items: [fakeSupplier], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllFilteredAndPaged();
            expect(result).toEqual(cached);
        });

        it('should fetch on miss and cache', async () => {
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeSupplier], total: 1 };
            mockSupplierRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            const result = await service.findAllFilteredAndPaged('ACME', '123');
            expect(result).toEqual(paged);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return supplier by id', async () => {
            mockSupplierRepo.findOne.mockResolvedValue(fakeSupplier);
            const result = await service.findById('s1');
            expect(result).toEqual(fakeSupplier);
        });
    });

    describe('createSupplier', () => {
        it('should create supplier and invalidate cache', async () => {
            mockSupplierRepo.create.mockReturnValue(fakeSupplier);
            mockSupplierRepo.save.mockResolvedValue(fakeSupplier);
            const result = await service.createSupplier({ name: 'ACME Corp' });
            expect(result).toEqual(fakeSupplier);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('suppliers:');
        });
    });

    describe('updateSupplier', () => {
        it('should throw NotFoundException if supplier not found', async () => {
            mockSupplierRepo.findOne.mockResolvedValue(null);
            await expect(service.updateSupplier('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
        });

        it('should update and invalidate cache', async () => {
            mockSupplierRepo.findOne.mockResolvedValue(fakeSupplier);
            mockSupplierRepo.save.mockResolvedValue({ ...fakeSupplier, name: 'Updated' });
            const result = await service.updateSupplier('s1', { name: 'Updated' });
            expect(result.name).toBe('Updated');
        });
    });

    describe('deleteSupplier', () => {
        it('should throw NotFoundException for empty ids', async () => {
            await expect(service.deleteSupplier([])).rejects.toThrow(NotFoundException);
        });

        it('should delete and invalidate cache', async () => {
            mockSupplierRepo.delete.mockResolvedValue(undefined);
            await service.deleteSupplier(['s1']);
            expect(mockSupplierRepo.delete).toHaveBeenCalledWith(['s1']);
        });
    });
});
