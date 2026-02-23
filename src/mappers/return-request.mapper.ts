import { ReturnRequest } from "@/entities/return-request.entity";
import { ReturnRequesTableResponse, ReturnRequestResponse } from "@libs/shared/types/return-request.type";
import { CustomerMapper } from "./customer.mapper";
import { OrderMapper } from "./order.mapper";
import { WarehouseMapper } from "./warehouse.mapper";
import { UsersMapper } from "./users.mapper";
import { Product } from "@/entities/product.entity";
import { ProductMapper } from "./product.mapper";

export class ReturnRequestMapper {
    static toResponse(entity: ReturnRequest): ReturnRequestResponse {
        return {
            id: entity.id,
            code: entity.code,
            order: OrderMapper.toResponse(entity.order),
            warehouse: WarehouseMapper.toResponse(entity.warehouse),
            creator: UsersMapper.toDTO(entity.creator),
            customer: CustomerMapper.toResponse(entity.customer),
            status: entity.status,
            reason: entity.reason,
            refundAmount: entity.refundAmount,
            items: entity.items?.map(item => ({
                id: item.id,
                returnRequest: undefined as any, // Avoid circular reference
                product: ProductMapper.toResponse(item.product as Product),
                quantity: item.quantity,
                refundPrice: item.refundPrice,
                returnedSerials: item.returnedSerials,
            })) || [],
            createdAt: entity.createdAt,
        }
    }

    static toResponseTable(entity: ReturnRequest): ReturnRequesTableResponse {
        return {
            id: entity.id,
            code: entity.code,
            orderCode: entity.order.code,
            customerName: entity.customer.fullName,
            status: entity.status,
            returnAmount: entity.refundAmount,
            createdAt: entity.createdAt,
        }
    }

    static toResponseTableList(entities: ReturnRequest[]) : ReturnRequesTableResponse[] {
        return entities.map(entity => this.toResponseTable(entity));
    }
}