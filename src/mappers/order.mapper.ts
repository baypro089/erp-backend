import { Order } from "@/entities/order.entity";
import { OrderResponse, OrderTableReponse } from "@libs/shared/types/order.type";
import { CustomerMapper } from "./customer.mapper";
import { OrderDetailMapper } from "./order-detail.mapper";
import { UsersMapper } from "./users.mapper";

export class OrderMapper {
    static toResponse(order: Order): OrderResponse {
        return {
            id: order.id,
            code: order.code,
            totalAmount: order.totalAmount,
            customer: CustomerMapper.toResponse(order.customer),
            creator: UsersMapper.toDTO(order.creator),
            status: order.status,
            shippingAddress: order.shippingAddress,
            note: order.note,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            items: order.items ? order.items.map(item => OrderDetailMapper.toResponse(item)) : [],
        }
    }

    static toTableResponse(order: Order): OrderTableReponse {
        return {
            id: order.id,
            code: order.code,
            totalAmount: order.totalAmount,
            customerName: order.customer.fullName,
            creatorName: order.creator.username,
            status: order.status,
            createdAt: order.createdAt,
        }
    }

    static toTableResponseList(orders: Order[]): OrderTableReponse[] {
        return orders.map(order => this.toTableResponse(order));
    }
}