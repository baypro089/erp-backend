import { Product } from "@/entities/product.entity";
import { ProductRepository } from "@/repositories/product.repository";
import { Injectable, NotFoundException } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { createHash } from 'crypto';
import { DataSource } from "typeorm";
import { Category } from "@/entities/category.entity";
import { Brand } from "@/entities/brand.entity";
import { AttachmentFolder } from "@libs/shared/enums/attachment.enum";
import { AttachmentService } from "./attachment.service";

@Injectable()
export class ProductService {
    // Define your service methods for product operations here
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
        private readonly attachmentService: AttachmentService
    ) { }

    async findAllFilteredAndPaged(
        sku?: string,
        name?: string,
        brandId?: string,
        categoryId?: string,
        retailPriceMin?: number,
        retailPriceMax?: number,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Product[], total: number }> {
        const rawKey = JSON.stringify({ sku, name, brandId, categoryId, retailPriceMin, retailPriceMax, page: page || 1, pageSize: pageSize || 10 });
        const cacheKey = `products:${createHash('md5').update(rawKey).digest('hex')}`;
        const cached = await this.redisService.get<{ items: Product[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await this.productRepository.findAllFilteredAndPaged(
            sku,
            name,
            brandId,
            categoryId,
            retailPriceMin,
            retailPriceMax,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async findById(id: string): Promise<Product | null> {
        return this.productRepository.findOne({ where: { id }, relations: ["category", "brand"] });
    }

    async createProduct(productData: Partial<Product>, thumbnailFile?: Express.Multer.File): Promise<Product> {
        const category = await this.dataSource.getRepository(Category).findOne({ where: { id: productData.categoryId } });
        if (!category) {
            throw new NotFoundException("Category not found");
        }
        const brand = await this.dataSource.getRepository(Brand).findOne({ where: { id: productData.brandId } });
        if (!brand) {
            throw new NotFoundException("Brand not found");
        }

        // Tạo product trước
        const product = this.productRepository.create({
            ...productData,
            category,
            brand,
        });

        const savedProduct = await this.productRepository.save(product);

        // Upload thumbnail nếu có
        if (thumbnailFile) {
            const attachment = await this.attachmentService.uploadFile(thumbnailFile, {
                folder: AttachmentFolder.PRODUCTS,
                entityType: 'product',
                entityId: savedProduct.id,
                description: 'Product thumbnail',
                tags: ['thumbnail', 'product-image'],
            });

            // Lưu attachment ID để generate URL qua view/:id
            savedProduct.thumbnailUrl = attachment.id;
            await this.productRepository.save(savedProduct);
        }

        await this.redisService.delByPrefix('products:');
        return savedProduct;
    }

    async updateProduct(id: string, updateData: Partial<Product>, thumbnailFile?: Express.Multer.File): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException("Product not found");
        }

        // Cập nhật category nếu có
        if (updateData.categoryId) {
            const category = await this.dataSource.getRepository(Category).findOne({ where: { id: updateData.categoryId } });
            if (!category) {
                throw new NotFoundException("Category not found");
            }
            product.category = category;
        }

        // Cập nhật brand nếu có
        if (updateData.brandId) {
            const brand = await this.dataSource.getRepository(Brand).findOne({ where: { id: updateData.brandId } });
            if (!brand) {
                throw new NotFoundException("Brand not found");
            }
            product.brand = brand;
        }

        // Thay đổi ảnh nếu có file mới
        if (thumbnailFile) {
            // Xóa ảnh cũ
            const oldAttachments = await this.attachmentService.findByEntity('product', id);
            if (oldAttachments.length > 0) {
                await this.attachmentService.deleteMultiple(oldAttachments.map(a => a.id));
            }

            // Upload ảnh mới
            const attachment = await this.attachmentService.uploadFile(thumbnailFile, {
                folder: AttachmentFolder.PRODUCTS,
                entityType: 'product',
                entityId: id,
                description: 'Product thumbnail',
                tags: ['thumbnail', 'product-image'],
            });

            // Lưu attachment ID để generate URL qua view/:id
            product.thumbnailUrl = attachment.id;
        }

        Object.assign(product, updateData);
        const result = await this.productRepository.save(product);
        await this.redisService.delByPrefix('products:');
        return result;
    }

    async deleteProduct(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            throw new NotFoundException("No product IDs provided for deletion");
        }

        // Xóa tất cả attachments trước
        for (const productId of ids) {
            const attachments = await this.attachmentService.findByEntity('product', productId);
            if (attachments.length > 0) {
                await this.attachmentService.deleteMultiple(attachments.map(a => a.id));
            }
        }

        // Xóa products
        await this.productRepository.delete(ids);
        await this.redisService.delByPrefix('products:');
    }

    /**
     * Lấy ảnh thumbnail của product (trả về entity để controller dùng mapper)
     */
    async getProductThumbnail(productId: string) {
        const attachments = await this.attachmentService.findByEntityRaw('product', productId);
        return attachments.find(a => a.tags?.includes('thumbnail')) || null;
    }
}