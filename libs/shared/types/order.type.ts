import { OrderStatus } from "../enums/order-status.enum";
import { CustomerResponse } from "./customer.type";
import { FulfillItemDto, OrderDetailResponse, OrderItemDto } from "./order-detail.type";
import { PagedResult } from "./pagedResult.type";
import { UserResponse } from "./users.type";

export type OrderResponse = {
    id: string; 
    code: string;
    discountAmount: number; // Chiết khấu tổng
    totalAmount: number;
    customer: CustomerResponse; 
    creator: UserResponse;
    status: OrderStatus;
    shippingProvider?: string;
    shippingAddress?: string;
    trackingCode?: string;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
    items: OrderDetailResponse[]; // Danh sách tên sản phẩm trong đơn
}

export type OrderTableReponse = {
    id: string; 
    code: string;
    totalAmount: number;
    customerName: string; // Tên khách hàng
    creatorName: string; // Tên nhân viên tạo đơn
    status: OrderStatus;
    createdAt: Date;
}

export type OrderListResponse = PagedResult<OrderTableReponse>;

export type CreateOrderDto = {
    customerId: string;
    discountAmount: number; // Chiết khấu tổng
    shippingProvider?: string;
    shippingAddress?: string;
    trackingCode?: string;
    note?: string;
    items: OrderItemDto[];
}

export type FulfillOrderDto = {
    warehouseId: string;
    items: FulfillItemDto[];
}