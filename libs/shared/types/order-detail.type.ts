import { OrderResponse } from "./order.type";
import { ProductResponse } from "./product.type";

export type OrderDetailResponse = {
    id: string;
    order: OrderResponse;
    product: ProductResponse;
    quantity: number;
    unitPrice: number;
    amount: number;
    assignedSerials?: string[]; // Danh sách Serial đã được gán cho OrderDetail này
}

export type OrderItemDto = {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export type FulfillItemDto = {
    orderItemId: string;
    scannedSerials?: string[]; // Danh sách Serial đã quét để xuất hàng
}