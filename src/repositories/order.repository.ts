import { Order } from "@/entities/order.entity";
import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";

@Injectable()
export class OrderRepository extends Repository<Order> {
    constructor(private dataSource: DataSource) {
        super(Order, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        code?: string,
        status?: string,
        dateFrom?: Date,
        dateTo?: Date,
        totalAmountFrom?: number,
        totalAmountTo?: number,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Order[], total: number }> {
        const queryBuilder = this.createQueryBuilder("order")
            .leftJoinAndSelect("order.customer", "customer")
            .leftJoinAndSelect("order.creator", "user");

        if (status) {
            queryBuilder.andWhere("order.status = :status", { status });
        }
        if (code) {
            queryBuilder.andWhere("order.code ILIKE :code", { code: `%${code}%` });
        }
        if (dateFrom) {
            queryBuilder.andWhere("order.createdAt >= :dateFrom", { dateFrom });
        }
        if (dateTo) {
            queryBuilder.andWhere("order.createdAt <= :dateTo", { dateTo });
        }
        if (totalAmountFrom !== undefined && totalAmountTo !== undefined) {
            queryBuilder.andWhere("order.totalAmount BETWEEN :totalAmountFrom AND :totalAmountTo", { totalAmountFrom, totalAmountTo });
        }
        queryBuilder.orderBy("order.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }
        const [items, total] = await queryBuilder.getManyAndCount();
        return { items, total };
    }
}