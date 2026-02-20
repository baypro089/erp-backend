import { StockHistory } from "@/entities/stock-history.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class StockHistoryRepository extends Repository<StockHistory> {
    constructor(dataSource: DataSource) {
        super(StockHistory, dataSource.createEntityManager());
    }

    async findAllByProductAndWarehouse(
        warehouseId: string,
        productId: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: StockHistory[], total: number }> {
        const query = this.createQueryBuilder("history")
            .leftJoinAndSelect("history.product", "product")
            .leftJoinAndSelect("product.category", "category")
            .leftJoinAndSelect("product.brand", "brand")
            .leftJoinAndSelect("history.warehouse", "warehouse")
            .leftJoinAndSelect("history.performer", "performer")
            .leftJoinAndSelect("performer.role", "role")
            .leftJoinAndSelect("performer.employee", "employee")
            .where("history.warehouseId = :warehouseId", { warehouseId })
            .andWhere("history.productId = :productId", { productId })
            .orderBy("history.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await query.getManyAndCount();

        return { items, total };
    }
}