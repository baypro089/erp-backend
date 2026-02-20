import { Product } from "@/entities/product.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class ProductRepository extends Repository<Product> {
    constructor(private dataSource: DataSource) {
        super(Product, dataSource.createEntityManager());
    }

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
        const queryBuilder = this.createQueryBuilder("product")
            .leftJoinAndSelect("product.category", "category")
            .leftJoinAndSelect("product.brand", "brand");

        if (sku) {
            queryBuilder.andWhere("unaccent(product.sku) ILIKE unaccent(:sku)", { sku: `%${sku}%` });
        }
        if (name) {
            queryBuilder.andWhere("unaccent(product.name) ILIKE unaccent(:name)", { name: `%${name}%` });
        }
        if (brandId) {
            queryBuilder.andWhere("product.brandId = :brandId", { brandId });
        }
        if (categoryId) {
            queryBuilder.andWhere("product.categoryId = :categoryId", { categoryId });
        }
        if (retailPriceMin !== undefined) {
            queryBuilder.andWhere("product.retailPrice >= :retailPriceMin", { retailPriceMin });
        }
        if (retailPriceMax !== undefined) {
            queryBuilder.andWhere("product.retailPrice <= :retailPriceMax", { retailPriceMax });
        }
        queryBuilder.orderBy("product.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await queryBuilder.getManyAndCount();
        return { items, total };
    }
}