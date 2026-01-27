import { Position } from "@/entities/position.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, In, Repository } from "typeorm";

@Injectable()
export class PositionRepository extends Repository<Position> {
    // Define your custom methods for position data access here
    constructor(private dataSource: DataSource) {
        super(Position, dataSource.createEntityManager());
    }

    async findAllPositionsOptional(
        name?: string,
        minSalary?: number,
        maxSalary?: number,
        page?: number,
        pageSize?: number,
    ): Promise<{items: Position[], total: number}> {
        const query = this.createQueryBuilder('position')
            .where('position.deletedAt IS NULL');

        if (name) {
            query.andWhere('unaccent(position.name) ILIKE unaccent(:name)', { name: `%${name}%` });
        }
        if (minSalary !== undefined) {
            query.andWhere('position.baseSalary >= :minSalary', { minSalary });
        }
        if (maxSalary !== undefined) {
            query.andWhere('position.baseSalary <= :maxSalary', { maxSalary });
        }
        
        if (page && pageSize) {
            query.orderBy('position.createdAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
        }

        const [items, total] = await query.getManyAndCount();

        return { items, total };
    }

    async findAllPositions(): Promise<Position[]> {
        return this.find({ where: {isDeleted: false} });
    }

    async findById(id: string): Promise<Position | null> {
        return this.findOne({ where: { id, isDeleted: false } });
    }

    async findByIds(ids: string[]): Promise<Position[]> {
        if (!ids || ids.length === 0) return [];
        return this.find({ where: { id : In(ids), isDeleted: false } });
    }

    async createPosition(positionData: Partial<Position>): Promise<Position> {
        const newPosition = await this.save(this.create(positionData));
        return newPosition;
    }

    async updatePosition(id: string, positionData: Partial<Position>): Promise<Position> {
        await this.update(id, positionData);
        return this.findById(id) as Promise<Position>;
    }

    async deletePosition(ids: string[]): Promise<void> {
        await this.update({ id: In(ids) }, { isDeleted: true, deletedAt: new Date() });
    }
}
