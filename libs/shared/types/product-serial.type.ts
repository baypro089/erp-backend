import { SerialStatus } from "../enums/serial-status.enum";
import { PagedResult } from "./pagedResult.type";
import { ProductResponse } from "./product.type";
import { WarehouseResponse } from "./warehouse.type";

export type ProductSerialResponse = {
    serialNumber: string;
    status: SerialStatus;
    product: ProductResponse;
    warehouse: WarehouseResponse;
    importReceiptId?: string;
    orderId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type UpdateSerialDto = {
    serialNumber: string;
    status: SerialStatus;
    note?: string;
}

export type ProductSerialListResponse = PagedResult<ProductSerialResponse>;