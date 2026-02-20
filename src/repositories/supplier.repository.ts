import { Supplier } from "@/entities/supplier.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class SupplierRepository extends Repository<Supplier> {
    constructor(private dataSource: DataSource) {
        super(Supplier, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        name?: string,
        contactPhone?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Supplier[], total: number }> {
        const queryBuilder = this.createQueryBuilder("supplier");
        if (name) {
            queryBuilder.where("unaccent(supplier.name) ILIKE unaccent(:name)", { name: `%${name}%` });
        }
        if (contactPhone) {
            queryBuilder.andWhere("supplier.contactPhone ILIKE :contactPhone", { contactPhone: `%${contactPhone}%` });
        }
        queryBuilder.orderBy("supplier.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }
        const [items, total] = await queryBuilder.getManyAndCount();
        return { items, total };
    }
}
