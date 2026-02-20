import { ImportReceiptResponse } from "./import-receipt.type";
import { ProductResponse } from "./product.type";

export type ImportDetailResponse = {
    id: string;
    receipt: ImportReceiptResponse;
    product: ProductResponse;
    quantity: number;
    unitPrice: number;
    amount: number;
    scannedSerials?: string[];
}

export type CreateImportDetailDto = {
    receiptId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    scannedSerials?: string[];
}