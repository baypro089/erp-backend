import { Customer } from "@/entities/customer.entity";
import { CustomerTier } from "@libs/shared/enums/customer-tier.enum";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class CustomerRepository extends Repository<Customer> {
    constructor(private dataSource: DataSource) {
        super(Customer, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        fullName?: string,
        phoneNumber?: string,
        tier?: CustomerTier,
        isActive?: boolean,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Customer[], total: number }> {
        const queryBuilder = this.createQueryBuilder("customer");

        if (fullName) {
            queryBuilder.andWhere("unaccent(customer.fullName) ILIKE unaccent(:fullName)", { fullName: `%${fullName}%` });
        }
        if (phoneNumber) {
            queryBuilder.andWhere("customer.phoneNumber ILIKE :phoneNumber", { phoneNumber: `%${phoneNumber}%` });
        }
        if (tier) {
            queryBuilder.andWhere("customer.tier = :tier", { tier });
        }
        if (isActive !== undefined) {
            queryBuilder.andWhere("customer.isActive = :isActive", { isActive });
        }
        queryBuilder.orderBy("customer.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await queryBuilder.getManyAndCount();
        return { items, total };
    }
}
