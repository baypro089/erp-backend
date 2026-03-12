import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '@/services/product.service';
import { ProductRepository } from '@/repositories/product.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { AttachmentService } from '@/services/attachment.service';
import { NotFoundException } from '@nestjs/common';
import { Category } from '@/entities/category.entity';
import { Brand } from '@/entities/brand.entity';

const fakeProduct = { id: 'prod1', name: 'Laptop', sku: 'LPT001', thumbnailUrl: null };
const fakeCategory = { id: 'cat1', name: 'Electronics' };
const fakeBrand = { id: 'br1', name: 'Dell' };

const mockProductRepo = {
    findAllFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };
const mockAttachment = {
    uploadFile: jest.fn(),
    findByEntity: jest.fn(),
    findByEntityRaw: jest.fn(),
    deleteMultiple: jest.fn(),
};

describe('ProductService', () => {
    let service: ProductService;
    let mockDataSource: any;

    const buildService = async (dsOverride?: any) => {
        mockDataSource = dsOverride ?? {
            getRepository: jest.fn((entity) => {
                if (entity === Category) return { findOne: jest.fn().mockResolvedValue(fakeCategory) };
                if (entity === Brand) return { findOne: jest.fn().mockResolvedValue(fakeBrand) };
                return {};
            }),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductService,
                { provide: ProductRepository, useValue: mockProductRepo },
                { provide: DataSource, useValue: mockDataSource },
                { provide: RedisService, useValue: mockRedis },
                { provide: AttachmentService, useValue: mockAttachment },
            ],
        }).compile();
        return module.get<ProductService>(ProductService);
    };

    beforeEach(() => jest.clearAllMocks());

    describe('findAllFilteredAndPaged', () => {
        it('should return cached result on hit', async () => {
            service = await buildService();
            const cached = { items: [fakeProduct], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllFilteredAndPaged();
            expect(result).toEqual(cached);
        });

        it('should fetch and cache on miss', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeProduct], total: 1 };
            mockProductRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            expect(await service.findAllFilteredAndPaged('LPT001')).toEqual(paged);
        });
    });

    describe('findById', () => {
        it('should return product with relations', async () => {
            service = await buildService();
            mockProductRepo.findOne.mockResolvedValue(fakeProduct);
            expect(await service.findById('prod1')).toEqual(fakeProduct);
        });
    });

    describe('createProduct', () => {
        it('should throw if category not found', async () => {
            service = await buildService({
                getRepository: jest.fn((entity) => {
                    if (entity === Category) return { findOne: jest.fn().mockResolvedValue(null) };
                    return {};
                }),
            });
            await expect(service.createProduct({ categoryId: 'ghost', brandId: 'br1' })).rejects.toThrow(NotFoundException);
        });

        it('should throw if brand not found', async () => {
            service = await buildService({
                getRepository: jest.fn((entity) => {
                    if (entity === Category) return { findOne: jest.fn().mockResolvedValue(fakeCategory) };
                    if (entity === Brand) return { findOne: jest.fn().mockResolvedValue(null) };
                    return {};
                }),
            });
            await expect(service.createProduct({ categoryId: 'cat1', brandId: 'ghost' })).rejects.toThrow(NotFoundException);
        });

        it('should create product without thumbnail', async () => {
            service = await buildService();
            mockProductRepo.create.mockReturnValue(fakeProduct);
            mockProductRepo.save.mockResolvedValue(fakeProduct);
            const result = await service.createProduct({ categoryId: 'cat1', brandId: 'br1', name: 'Laptop' });
            expect(result).toEqual(fakeProduct);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('products:');
        });
    });

    describe('updateProduct', () => {
        it('should throw if product not found', async () => {
            service = await buildService();
            mockProductRepo.findOne.mockResolvedValue(null);
            await expect(service.updateProduct('ghost', {})).rejects.toThrow(NotFoundException);
        });

        it('should update product', async () => {
            service = await buildService();
            mockProductRepo.findOne.mockResolvedValue(fakeProduct);
            mockProductRepo.save.mockResolvedValue({ ...fakeProduct, name: 'Updated' });
            const result = await service.updateProduct('prod1', { name: 'Updated' });
            expect(result.name).toBe('Updated');
        });
    });

    describe('deleteProduct', () => {
        it('should throw NotFoundException for empty ids', async () => {
            service = await buildService();
            await expect(service.deleteProduct([])).rejects.toThrow(NotFoundException);
        });

        it('should delete products and attachments', async () => {
            service = await buildService();
            mockAttachment.findByEntity.mockResolvedValue([{ id: 'att1' }]);
            mockAttachment.deleteMultiple.mockResolvedValue(undefined);
            mockProductRepo.delete.mockResolvedValue(undefined);
            await service.deleteProduct(['prod1']);
            expect(mockAttachment.deleteMultiple).toHaveBeenCalledWith(['att1']);
        });
    });
});
