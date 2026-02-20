import { ProductMapper } from "./product.mapper";

import { ProductSerialResponse } from "@libs/shared/types/product-serial.type";
import { WarehouseMapper } from "./warehouse.mapper";
import { ProductSerial } from "@/entities/product-serial.entity";
export class ProductSerialMapper {
    static toResponse(entity: ProductSerial): ProductSerialResponse {
        return {
            serialNumber: entity.serialNumber,
            status: entity.status,
            product: ProductMapper.toResponse(entity.product),
            warehouse: WarehouseMapper.toResponse(entity.warehouse),
            importReceiptId: entity.importReceiptId || undefined,
            orderId: entity.orderId || undefined,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        }
    }

    static toResponseList(entities: ProductSerial[]): ProductSerialResponse[] {
        return entities.map(e => this.toResponse(e));
    }
}