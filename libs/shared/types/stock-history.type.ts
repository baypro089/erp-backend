import { StockChangeType } from "../enums/warehouse-type.enum";
import { PagedResult } from "./pagedResult.type";
import { ProductResponse } from "./product.type";
import { UserResponse } from "./users.type";
import { WarehouseResponse } from "./warehouse.type";

export type StockHistoryResponse = {
    id: string;
    product: ProductResponse;
    warehouse: WarehouseResponse;
    type: StockChangeType; // "IN" hoặc "OUT"
    changeAmount: number; // Số thay đổi: +10 hoặc -5
    balanceAfter: number; // Số dư cuối kỳ (Sau khi đổi): 100 -> 110
    referenceCode?: string; // Mã phiếu liên quan (VD: Mã đơn hàng, Mã phiếu nhập)
    reason?: string; // Lý do (VD: "Xuất bán cho khách A")
    performer?: UserResponse; // Tên người thực hiện
    createdAt: Date;
};

export type StockHistoryFilteredAndPaged = PagedResult<StockHistoryResponse>;

