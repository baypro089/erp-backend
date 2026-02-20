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

export type ProductStockFilteredAndPaged = PagedResult<ProductStockResponse>;