import { Warehouse } from "@/entities/warehouse.entity";
import { WarehouseResponse } from "@libs/shared/types/warehouse.type";
import { EmployeesMapper } from "./employees.mapper";

export class WarehouseMapper {
    static toResponse(entity: Warehouse): WarehouseResponse {
        return {
            id: entity.id,
            code: entity.code,
            name: entity.name,
            address: entity.address,
            type: entity.type,
            manager: entity.manager ? EmployeesMapper.toResponse(entity.manager) : undefined,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    static toResponseList(entities: Warehouse[]): WarehouseResponse[] {
        return entities.map(this.toResponse);
    }
}