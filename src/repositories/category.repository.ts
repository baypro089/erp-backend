import { Category } from "@/entities/category.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class CategoryRepository extends Repository<Category> {
    constructor(private readonly dataSource: DataSource) {
        super(Category, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        name?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Category[], total: number }> {
        const queryBuilder = this.createQueryBuilder("category")
            .leftJoinAndSelect("category.parent", "parent");
        if (name) {
            queryBuilder.where("unaccent(category.name) ILIKE unaccent(:name)", { name: `%${name}%` });
        }

        queryBuilder.orderBy("category.createdAt", "DESC");

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            queryBuilder.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await queryBuilder.getManyAndCount();
        return { items, total };
    }
}