import { StockHistory } from "@/entities/stock-history.entity";
import { StockHistoryResponse } from "@libs/shared/types/stock-history.type";
import { ProductMapper } from "./product.mapper";
import { WarehouseMapper } from "./warehouse.mapper";
import { UsersMapper } from "./users.mapper";

export class StockHistoryMapper {
    static toResponse(history: StockHistory) : StockHistoryResponse {
        return {    
            id: history.id,
            product: ProductMapper.toResponse(history.product),
            warehouse: WarehouseMapper.toResponse(history.warehouse),
            type: history.type,
            changeAmount: history.changeAmount,
            balanceAfter: history.balanceAfter,
            referenceCode: history.referenceCode,
            reason: history.reason,
            performer: history.performer ? UsersMapper.toDTO(history.performer) : undefined,
            createdAt: history.createdAt,
        }
    };

    static toResponseList(histories: StockHistory[]): StockHistoryResponse[] {
        return histories.map(h => this.toResponse(h));
    }
}