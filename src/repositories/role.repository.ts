import { Role } from "@/entities/role.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, In, Repository } from "typeorm";

@Injectable()
export class RoleRepository extends Repository<Role> {
    constructor(private dataSource: DataSource) {
        super(Role, dataSource.createEntityManager());
    }

    async findByCondition(roleCode?: string, roleName?: string): Promise<Role[]> {
        const query = this.createQueryBuilder('role');

        if (roleCode) {
            query.andWhere('role.role_code ILIKE :role_code', { role_code: `%${roleCode}%` });
        }

        if (roleName) {
            query.andWhere('role.role_name ILIKE :role_name', { role_name: `%${roleName}%` });
        }

        query.andWhere('role.isActive = :is_active', { is_active: true });

        return await query.getMany();
    }

    async findByCode(roleCode: string): Promise<Role | null> {
        return this.findOne({
            where: { role_code: roleCode, isActive: true },
            relations: ['users', 'permissions'],
        });
    }

    async findByCodes(roleCodes: string[]): Promise<Role[]> {
        if (!roleCodes || roleCodes.length === 0) return [];
        return await this.find({
            where: { role_code: In(roleCodes) },
            relations: ['users', 'permissions'],
        });
    }

    async handleCreate(role: Partial<Role>): Promise<Role> {
        const newRole = await this.save(this.create(role));
        return newRole;
    }

    async handleUpdate(role: Partial<Role>): Promise<Role | null> {
        await this.save(role);
        return this.findByCode(role.role_code as string);
    }

    async handleDelete(role: Role): Promise<void> {
        await this.remove(role);
    }
}