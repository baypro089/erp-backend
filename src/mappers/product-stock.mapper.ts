import { ProductStock } from "@/entities/product-stock.entity";
import { ProductStockResponse } from "@libs/shared/types/product-stock.type";
import { ProductMapper } from "./product.mapper";
import { WarehouseMapper } from "./warehouse.mapper";

export class ProductStockMapper{
    static toResponse(entity: ProductStock): ProductStockResponse {
        return {
            id: entity.id,
            product: ProductMapper.toResponse(entity.product),
            warehouse: WarehouseMapper.toResponse(entity.warehouse),
            quantity: entity.quantity,
            minStockLevel: entity.minStockLevel,
            lastUpdated: entity.lastUpdated,
        };
    }

    static toResponseList(entities: ProductStock[]): ProductStockResponse[] {
        return entities.map(entity => this.toResponse(entity));
    }
}