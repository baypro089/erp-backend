import { ProductResponse } from "./product.type";
import { ReturnRequestResponse } from "./return-request.type";

export type ReturnItemResponse = {
    id: string;
    returnRequest: ReturnRequestResponse;
    product: ProductResponse;
    quantity: number;
    refundPrice: number;
    returnedSerials: string[];
}

export type CreateReturnItemDto = {
    productId: string;
    quantity: number;
    refundPrice: number;
    returnedSerials?: string[];
}