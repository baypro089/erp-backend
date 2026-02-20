import { Supplier } from "@/entities/supplier.entity";
import { SupplierResponse } from "@libs/shared/types/supplier.type";

export class SupplierMapper {
    static toResponse(entity: Supplier) : SupplierResponse{
        return {
            id: entity.id,
            name: entity.name,
            contactPhone: entity.contactPhone,
            address: entity.address,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    static toResponseList(entities: Supplier[]) : SupplierResponse[] {
        return entities.map(e => this.toResponse(e));
    }
}
