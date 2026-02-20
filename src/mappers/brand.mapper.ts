import { Brand } from "@/entities/brand.entity";
import { BrandResponse } from "@libs/shared/types/brand.type";

export class BrandMapper {
    static toResponse(entity: Brand): BrandResponse {
        return {
            id: entity.id,
            name: entity.name,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        }
    }

    static toResponseList(entities: Brand[]): BrandResponse[] {
        return entities.map(entity => this.toResponse(entity));
    }
}