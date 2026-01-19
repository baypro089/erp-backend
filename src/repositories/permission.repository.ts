import { Permission } from "@/entities/permission.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, FindManyOptions, In, Like, Repository } from "typeorm";

@Injectable()
export class PermissionRepository extends Repository<Permission> {
    constructor(private dataSource: DataSource) {
        super(Permission, dataSource.createEntityManager());
    }

    async getAllPermissions(): Promise<Permission[]> {
        return this.find();
    }

    async findByCode(code: string): Promise<Permission | null> {
        return await this.findOne({ where: { permission_code: code } });
    }

    async findByCodes(codes: string[]): Promise<Permission[]> {
        if (!codes || codes.length === 0) return [];
        return await this.find({
            where: { permission_code: In(codes) },
        });
    }
}