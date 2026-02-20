import { ProductStock } from "@/entities/product-stock.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class ProductStockRepository extends Repository<ProductStock> {
    constructor(private dataSource: DataSource) {
        super(ProductStock, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        warehouseId: string,
        search?: string,
        lowStock?: boolean,
        page?: number,
        pageSize?: number,
    ): Promise<{items: ProductStock[], total: number}> {
        const query = this.createQueryBuilder("stock")
            .leftJoinAndSelect("stock.product", "product")
            .leftJoinAndSelect("product.category", "category")
            .leftJoinAndSelect("product.brand", "brand")
            .leftJoinAndSelect("stock.warehouse", "warehouse")
            .where("stock.warehouseId = :warehouseId", { warehouseId });

        if (search) {   
            query.andWhere("unaccent(product.name) ILIKE unaccent(:search) OR unaccent(product.sku) ILIKE unaccent(:search)", { search: `%${search}%` });
        }
        if (lowStock) {
            query.andWhere("stock.quantity <= stock.minStockLevel");
        }
        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await query.getManyAndCount();
        return { items, total };
    }
}