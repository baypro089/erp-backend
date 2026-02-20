import { Category } from "@/entities/category.entity";
import { CategoryRepository } from "@/repositories/category.repository";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { RedisService } from "./redis.service";
import { createHash } from 'crypto';

@Injectable()
export class CategoryService {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    async findAllFilteredAndPaged(
        name?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Category[], total: number }> {
        const rawKey = JSON.stringify({ name, page: page || 1, pageSize: pageSize || 10 });
        const cacheKey = `categories:${createHash('md5').update(rawKey).digest('hex')}`;
        const cached = await this.redisService.get<{ items: Category[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await this.categoryRepository.findAllFilteredAndPaged(name, page, pageSize);
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async findById(id: string): Promise<Category | null> {
        return this.categoryRepository.findOne({
            where: { id },
            relations: ["parent"],
        });
    }

    async createCategory(categoryData: Partial<Category>): Promise<Category> {
        let category: Category;
        if (categoryData.parentId) {
            const parentCategory = await this.categoryRepository.findOne({ where: { id: categoryData.parentId } });
            if (!parentCategory) {
                throw new NotFoundException("Parent category not found");
            }
            category = this.categoryRepository.create({
                ...categoryData,
                parent: parentCategory,
            });
        }
        category = this.categoryRepository.create({
            ...categoryData,
        });
        const result = await this.categoryRepository.save(category);
        await this.redisService.delByPrefix('categories:');
        return result;
    }

    async updateCategory(id: string, updateData: Partial<Category>): Promise<Category> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException("Category not found");
        }
        if (updateData.parentId) {
            const parentCategory = await this.categoryRepository.findOne({ where: { id: updateData.parentId } });
            if (!parentCategory) {
                throw new NotFoundException("Parent category not found");
            }
            category.parent = parentCategory;
        }
        Object.assign(category, updateData);
        const result = await this.categoryRepository.save(category);
        await this.redisService.delByPrefix('categories:');
        return result;
    }
    async deleteCategory(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            throw new BadRequestException("No category IDs provided for deletion");
        }

        const categories = await this.categoryRepository.find({
            where: { id: In(ids) },
        });

        if (!categories) {
            throw new NotFoundException("No categories found for the provided IDs");
        }

        for (const category of categories) {
            const childCategories = await this.categoryRepository.find({
                where: { parent: { id: category.id } },
            });
            if (childCategories.length > 0) {
                throw new BadRequestException(`Cannot delete category ${category.id} because it has child categories`);
            }
        }

        await this.categoryRepository.delete(ids);
        await this.redisService.delByPrefix('categories:');
    }
}