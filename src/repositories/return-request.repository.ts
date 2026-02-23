import { ReturnRequest } from "@/entities/return-request.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class ReturnRequestRepository extends Repository<ReturnRequest> {
    constructor(private dataSource: DataSource) {
        super(ReturnRequest, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        code?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: ReturnRequest[], total: number }> {
        const queryBuilder = this.createQueryBuilder("returnRequest")
            .leftJoinAndSelect("returnRequest.order", "order")
            .leftJoinAndSelect("returnRequest.customer", "customer")
            .leftJoinAndSelect("returnRequest.warehouse", "warehouse")
            .leftJoinAndSelect("returnRequest.creator", "creator")
            .leftJoinAndSelect("returnRequest.items", "items")
            .leftJoinAndSelect("items.product", "product");

        if (code) {
            queryBuilder.andWhere("returnRequest.code LIKE :code", { code: `%${code}%` });
        }

        queryBuilder.orderBy("returnRequest.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await queryBuilder.getManyAndCount();

        return { items, total };
    }
}