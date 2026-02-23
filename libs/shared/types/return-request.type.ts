import { ReturnStatus } from "../enums/return-status.enum";
import { CustomerResponse } from "./customer.type";
import { OrderResponse } from "./order.type";
import { PagedResult } from "./pagedResult.type";
import { CreateReturnItemDto, ReturnItemResponse } from "./return-item.type";
import { UserResponse } from "./users.type";
import { WarehouseResponse } from "./warehouse.type";

export type ReturnRequestResponse = {
    id: string;
    code: string;
    order: OrderResponse;
    warehouse: WarehouseResponse;
    creator: UserResponse;
    customer: CustomerResponse;
    status: ReturnStatus;
    reason: string;
    refundAmount: number;
    items: ReturnItemResponse[];
    createdAt: Date;
};

export type ReturnRequesTableResponse = {
    id: string;
    code: string;
    orderCode: string;
    customerName: string;
    status: ReturnStatus;
    returnAmount: number;
    createdAt: Date;
}

export type ReturnRequesTableListResponse = PagedResult<ReturnRequesTableResponse>;

export type CreateReturnRequestDto = {
    orderId: string;
    warehouseId: string;
    reason: string;
    items: CreateReturnItemDto[];
}