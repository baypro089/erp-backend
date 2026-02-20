import { ProductSerial } from "@/entities/product-serial.entity";
import { SerialStatus } from "@libs/shared/enums/serial-status.enum";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class ProductSerialRepository extends Repository<ProductSerial> {
    constructor(private readonly dataSource: DataSource) {
        super(ProductSerial, dataSource.createEntityManager());
    }

    async findAllByProductWithPagination(
        productId: string,
        warehouseId: string,
        page?: number,
        pageSize?: number
    ): Promise<{ data: ProductSerial[]; total: number }> {
        const queryBuilder = this.createQueryBuilder('ps')
            .leftJoinAndSelect('ps.product', 'product')
            .leftJoinAndSelect('ps.warehouse', 'warehouse')
            .where('ps.productId = :productId', { productId })
            .andWhere('ps.warehouseId = :warehouseId', { warehouseId })
            .andWhere('ps.status != :status', { status: SerialStatus.AVAILABLE }) // Lọc ra những serial còn tồn kho
            .orderBy('ps.createdAt', 'DESC');

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
}