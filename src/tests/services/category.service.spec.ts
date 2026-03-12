import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '@/services/category.service';
import { CategoryRepository } from '@/repositories/category.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockCategoryRepo = {
    findAllFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };
const mockDataSource = {};

const fakeCategory = { id: 'c1', name: 'Electronics', parentId: null };
const fakeChildCategory = { id: 'c2', name: 'Phones', parentId: 'c1', parent: fakeCategory };

describe('CategoryService', () => {
    let service: CategoryService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryService,
                { provide: CategoryRepository, useValue: mockCategoryRepo },
                { provide: DataSource, useValue: mockDataSource },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get<CategoryService>(CategoryService);
    });

    describe('findAllFilteredAndPaged', () => {
        it('should return cached result on hit', async () => {
            const cached = { items: [fakeCategory], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllFilteredAndPaged('Elec');
            expect(result).toEqual(cached);
        });

        it('should fetch and cache on miss', async () => {
            const paged = { items: [fakeCategory], total: 1 };
            mockRedis.get.mockResolvedValue(null);
            mockCategoryRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            const result = await service.findAllFilteredAndPaged();
            expect(result).toEqual(paged);
        });
    });

    describe('findById', () => {
        it('should return category with parent relation', async () => {
            mockCategoryRepo.findOne.mockResolvedValue(fakeChildCategory);
            const result = await service.findById('c2');
            expect(result).toEqual(fakeChildCategory);
        });
    });

    describe('createCategory', () => {
        it('should throw NotFoundException if parent category not found', async () => {
            mockCategoryRepo.findOne.mockResolvedValue(null);
            await expect(service.createCategory({ name: 'Phones', parentId: 'ghost' })).rejects.toThrow(NotFoundException);
        });

        it('should create category without parent', async () => {
            mockCategoryRepo.create.mockReturnValue(fakeCategory);
            mockCategoryRepo.save.mockResolvedValue(fakeCategory);
            const result = await service.createCategory({ name: 'Electronics' });
            expect(result).toEqual(fakeCategory);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('categories:');
        });
    });

    describe('updateCategory', () => {
        it('should throw NotFoundException if category not found', async () => {
            mockCategoryRepo.findOne.mockResolvedValue(null);
            await expect(service.updateCategory('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
        });

        it('should update category', async () => {
            mockCategoryRepo.findOne
                .mockResolvedValueOnce(fakeCategory) // find category to update
                .mockResolvedValueOnce(null);        // no parent lookup needed
            mockCategoryRepo.save.mockResolvedValue({ ...fakeCategory, name: 'Computers' });
            const result = await service.updateCategory('c1', { name: 'Computers' });
            expect(result.name).toBe('Computers');
        });
    });

    describe('deleteCategory', () => {
        it('should throw BadRequestException if no ids provided', async () => {
            await expect(service.deleteCategory([])).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if category has children', async () => {
            mockCategoryRepo.find
                .mockResolvedValueOnce([fakeCategory])   // categories to delete
                .mockResolvedValueOnce([fakeChildCategory]); // child check
            await expect(service.deleteCategory(['c1'])).rejects.toThrow(BadRequestException);
        });

        it('should delete categories with no children', async () => {
            mockCategoryRepo.find
                .mockResolvedValueOnce([fakeCategory])
                .mockResolvedValueOnce([]);
            mockCategoryRepo.delete.mockResolvedValue(undefined);
            await service.deleteCategory(['c1']);
            expect(mockCategoryRepo.delete).toHaveBeenCalledWith(['c1']);
        });
    });
});
