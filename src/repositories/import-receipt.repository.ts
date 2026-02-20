import { ImportReceipt } from "@/entities/import-receipt.entity";
import { ReceiptStatus } from "@libs/shared/enums/receipt-status.enum";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class ImportReceiptRepository extends Repository<ImportReceipt> {
    constructor(private readonly dataSource: DataSource) {
        super(ImportReceipt, dataSource.createEntityManager());
    }

    async findAllWithFilteredAndPaged(
        code?: string,
        warehouseId?: string,
        dateFrom?: Date,
        dateTo?: Date,
        totalPriceFrom?: number,
        totalPriceTo?: number,
        status?: ReceiptStatus,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: ImportReceipt[], total: number }> {
        const query = this.createQueryBuilder('receipt')
            .leftJoinAndSelect('receipt.warehouse', 'warehouse')
            .leftJoinAndSelect('receipt.supplier', 'supplier')
            .leftJoinAndSelect('receipt.createdByUser', 'user');
        if (code) {
            query.andWhere('receipt.code LIKE :code', { code: `%${code}%` });
        }
        if (warehouseId) {
            query.andWhere('receipt.warehouseId = :warehouseId', { warehouseId });
        }
        if (dateFrom) {
            query.andWhere('receipt.createdAt >= :dateFrom', { dateFrom });
        }
        if (dateTo) {
            query.andWhere('receipt.createdAt <= :dateTo', { dateTo });
        }
        if (totalPriceFrom !== undefined && totalPriceTo !== undefined) {
            query.andWhere('receipt.totalPrice BETWEEN :totalPriceFrom AND :totalPriceTo', { totalPriceFrom, totalPriceTo });
        }
        if (status !== undefined) {
            query.andWhere('receipt.status = :status', { status });
        }
        if (page !== undefined && pageSize !== undefined) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }
        const [items, total] = await query.getManyAndCount();
        return { items, total };
    }
}