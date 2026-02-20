import { Brand } from "@/entities/brand.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class BrandRepository extends Repository<Brand> {
    constructor(private dataSource: DataSource) {
        super(Brand, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        name?: string,
        page?: number,
        pageSize?: number,      
    ): Promise<{ items: Brand[], total: number }> {
        const queryBuilder = this.createQueryBuilder("brand");
        if (name) {
            queryBuilder.where("unaccent(brand.name) ILIKE unaccent(:name)", { name: `%${name}%` });
        }
        queryBuilder.orderBy("brand.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }
        const [items, total] = await queryBuilder.getManyAndCount();
        return { items, total };  
    }
}