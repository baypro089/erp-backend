import { Product } from "@/entities/product.entity";
import { ProductResponse, ProductTableResponse } from "@libs/shared/types/product.type";
import { CategoryMapper } from "./category.mapper";
import { BrandMapper } from "./brand.mapper";

export class ProductMapper {
    static toResponse(entity: Product): ProductResponse {
        return {
            id: entity.id,
            sku: entity.sku,
            name: entity.name,
            category: CategoryMapper.toResponse(entity.category),
            brand: BrandMapper.toResponse(entity.brand),
            retailPrice: entity.retailPrice,
            stockQuantity: entity.stockQuantity,
            warrantyMonths: entity.warrantyMonths,
            hasSerialNumber: entity.hasSerialNumber,
            specifications: entity.specifications,
            thumbnailUrl: entity.thumbnailUrl,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        }
    }

    static toResonseTable(entity: Product): ProductTableResponse {
        return {
            id: entity.id,
            sku: entity.sku,
            name: entity.name,
            categoryName: entity.category.name,
            brandName: entity.brand.name,
            retailPrice: entity.retailPrice,
            stockQuantity: entity.stockQuantity,
            isActive: entity.isActive,
        }
    }

    static toResponseTableList(entities: Product[]): ProductTableResponse[] {
        return entities.map(entity => this.toResonseTable(entity));
    }
}