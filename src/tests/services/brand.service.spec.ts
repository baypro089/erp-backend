import { Test, TestingModule } from '@nestjs/testing';
import { BrandService } from '@/services/brand.service';
import { BrandRepository } from '@/repositories/brand.repository';
import { RedisService } from '@/services/redis.service';
import { NotFoundException } from '@nestjs/common';

const mockBrandRepo = {
    findAllFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

const fakeBrand = { id: 'b1', name: 'Apple' };

describe('BrandService', () => {
    let service: BrandService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BrandService,
                { provide: BrandRepository, useValue: mockBrandRepo },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get<BrandService>(BrandService);
    });

    describe('findAllFilteredAndPaged', () => {
        it('should return from cache on hit', async () => {
            const cached = { items: [fakeBrand], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllFilteredAndPaged('Apple');
            expect(result).toEqual(cached);
            expect(mockBrandRepo.findAllFilteredAndPaged).not.toHaveBeenCalled();
        });

        it('should fetch and cache on miss', async () => {
            const paged = { items: [fakeBrand], total: 1 };
            mockRedis.get.mockResolvedValue(null);
            mockBrandRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            const result = await service.findAllFilteredAndPaged();
            expect(result).toEqual(paged);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return brand by id', async () => {
            mockBrandRepo.findOne.mockResolvedValue(fakeBrand);
            const result = await service.findById('b1');
            expect(result).toEqual(fakeBrand);
        });
    });

    describe('createBrand', () => {
        it('should create brand and invalidate cache', async () => {
            mockBrandRepo.create.mockReturnValue(fakeBrand);
            mockBrandRepo.save.mockResolvedValue(fakeBrand);
            const result = await service.createBrand({ name: 'Apple' });
            expect(result).toEqual(fakeBrand);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('brands:');
        });
    });

    describe('updateBrand', () => {
        it('should throw NotFoundException if brand not found', async () => {
            mockBrandRepo.findOne.mockResolvedValue(null);
            await expect(service.updateBrand('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
        });

        it('should update brand and invalidate cache', async () => {
            mockBrandRepo.findOne.mockResolvedValue(fakeBrand);
            mockBrandRepo.save.mockResolvedValue({ ...fakeBrand, name: 'Samsung' });
            const result = await service.updateBrand('b1', { name: 'Samsung' });
            expect(result.name).toBe('Samsung');
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('brands:');
        });
    });

    describe('deleteBrand', () => {
        it('should throw NotFoundException if no ids provided', async () => {
            await expect(service.deleteBrand([])).rejects.toThrow(NotFoundException);
        });

        it('should delete brand and invalidate cache', async () => {
            mockBrandRepo.delete.mockResolvedValue(undefined);
            await service.deleteBrand(['b1']);
            expect(mockBrandRepo.delete).toHaveBeenCalledWith(['b1']);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('brands:');
        });
    });
});
