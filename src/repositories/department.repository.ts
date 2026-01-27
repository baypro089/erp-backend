import { Department } from "@/entities/department.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class DepartmentRepository extends Repository<Department> {
    // Define your custom methods for department data access here
    constructor(private dataSource: DataSource) {
        super(Department, dataSource.createEntityManager());
    }

    async findAllDepartmentsOptional(
        name?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{items: Department[], total: number}> {
        const query = this.createQueryBuilder('department')
            .where('department.deletedAt IS NULL');

        if (name) {
            query.andWhere('unaccent(department.name) ILIKE unaccent(:name)', { name: `%${name}%` });
        }
        
        if (page && pageSize) {
            query.orderBy('department.createdAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
        }

        const [items, total] = await query.getManyAndCount();

        return { items, total };
    }

    async findAllDepartments(): Promise<Department[]> {
        return this.find({ where: { deletedAt: null as any } });
    }

    async findById(id: string): Promise<Department | null> {
        return this.findOne({ where: { id, deletedAt: null as any } });
    }

    async createDepartment(departmentData: Partial<Department>): Promise<Department> {
        const newDepartment = await this.save(this.create(departmentData));
        return newDepartment;
    }

    async updateDepartment(id: string, departmentData: Partial<Department>): Promise<Department> {
        await this.update(id, departmentData);
        return this.findById(id) as Promise<Department>;
    }

    async deleteDepartments(ids: string[]): Promise<void> {
        await this.update(ids, { isDeleted: true, deletedAt: new Date() });
    }

}
