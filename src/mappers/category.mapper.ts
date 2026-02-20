import { Category } from "@/entities/category.entity";
import { CategoryResponse } from "@libs/shared/types/category.type";

export class CategoryMapper {
  // Mapping methods would go here
  static toResponse(entity: Category) : CategoryResponse {
    return {
        id: entity.id,
        name: entity.name,
        parent: entity.parent ? this.toResponse(entity.parent) : undefined,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    }
  }

  static toResponseList(entities: Category[]): CategoryResponse[] {
    return entities.map(entity => this.toResponse(entity));
  }
}