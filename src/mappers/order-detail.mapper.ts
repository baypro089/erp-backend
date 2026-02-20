import { OrderDetail } from "@/entities/order-detail.entity";
import { OrderDetailResponse } from "@libs/shared/types/order-detail.type";
import { OrderMapper } from "./order.mapper";
import { ProductMapper } from "./product.mapper";

export class OrderDetailMapper {
    static toResponse(orderDetail: OrderDetail): OrderDetailResponse {
        return {
            id: orderDetail.id,
            order: undefined as any, // Tránh circular reference, sẽ gán sau khi map Order
            product: ProductMapper.toResponse(orderDetail.product),
            quantity: orderDetail.quantity,
            unitPrice: orderDetail.unitPrice,
            amount: orderDetail.amount,
            assignedSerials: orderDetail.assignedSerials
        }
    }
}