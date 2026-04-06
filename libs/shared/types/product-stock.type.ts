import { PagedResult } from "./pagedResult.type";
import { ProductResponse } from "./product.type";
import { WarehouseResponse } from "./warehouse.type";

export type ProductStockResponse = {
    id: string;
    quantity: number;
    minStockLevel: number;
    lastUpdated: Date;
    product: ProductResponse; // Tên sản phẩm để hiển thị
    warehouse: WarehouseResponse; // Tên kho để hiển thị
};

export type StockAdjustmentDTO = {
    warehouseId: string;
    productId: string;
    delta: number;
    reason: string;
};

export type ProductStockFilteredAndPaged = PagedResult<ProductStockResponse>;