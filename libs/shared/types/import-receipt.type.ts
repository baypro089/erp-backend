import { CreateImportDetailDto, ImportDetailResponse } from "./import-detail.type";
import { PagedResult } from "./pagedResult.type";
import { SupplierResponse } from "./supplier.type";
import { UserResponse } from "./users.type";
import { WarehouseResponse } from "./warehouse.type";

export type ImportReceiptResponse = {
    id: string;
    code: string;
    warehouse: WarehouseResponse;
    supplier?: SupplierResponse;
    createdBy: UserResponse;
    totalPrice: number;
    note?: string;
    status: string;
    createdAt: Date;
    items: ImportDetailResponse[];
}

export type ImportReceiptTableResponse = {
    id: string;
    code: string;
    warehouseName: string;
    supplierName: string;
    createdByName: string;
    totalPrice: number;
    status: string;
    createdAt: Date;
    itemsCount: number;
}

export type ImportReceiptTableFilteredAndPaged = PagedResult<ImportReceiptTableResponse>;

export type CreateImportReceiptDto = {
    code: string;
    warehouseId: string;
    supplierId?: string;
    note?: string;
    items: CreateImportDetailDto[];
}