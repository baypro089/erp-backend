import { Brand } from "@/entities/brand.entity";
import { BrandRepository } from "@/repositories/brand.repository";
import { Injectable, NotFoundException } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { createHash } from 'crypto';

@Injectable()
export class BrandService {
    // Define your service methods for brand operations here
    constructor(
        private readonly brandRepository: BrandRepository,
        private readonly redisService: RedisService,
    ) { }

    async findAllFilteredAndPaged(
        name?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Brand[], total: number }> {
        const rawKey = JSON.stringify({ name, page: page || 1, pageSize: pageSize || 10 });
        const cacheKey = `brands:${createHash('md5').update(rawKey).digest('hex')}`;
        const cached = await this.redisService.get<{ items: Brand[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await this.brandRepository.findAllFilteredAndPaged(name, page, pageSize);
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async findById(id: string): Promise<Brand | null> {
        return this.brandRepository.findOne({ where: { id } });
    }

    async createBrand(brandData: Partial<Brand>): Promise<Brand> {
        const brand = this.brandRepository.create(brandData);
        const result = await this.brandRepository.save(brand);
        await this.redisService.delByPrefix('brands:');
        return result;
    }

    async updateBrand(id: string, updateData: Partial<Brand>): Promise<Brand> {
        const brand = await this.brandRepository.findOne({ where: { id } });
        if (!brand) {
            throw new NotFoundException("Brand not found");
        }
        Object.assign(brand, updateData);
        const result = await this.brandRepository.save(brand);
        await this.redisService.delByPrefix('brands:');
        return result;
    }

    async deleteBrand(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            throw new NotFoundException("No brand IDs provided for deletion");
        }
        await this.brandRepository.delete(ids);
        await this.redisService.delByPrefix('brands:');
    }
}