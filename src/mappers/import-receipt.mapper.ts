import { ImportReceipt } from "@/entities/import-receipt.entity";
import { ImportReceiptResponse } from "@libs/shared/types/import-receipt.type";
import { WarehouseMapper } from "./warehouse.mapper";
import { SupplierMapper } from "./supplier.mapper";
import { UsersMapper } from "./users.mapper";
import { ImportDetailResponse } from "@libs/shared/types/import-detail.type";
import { ProductMapper } from "./product.mapper";

export class ImportReceiptMapper {
    // Response đầy đủ cho chi tiết phiếu nhập (include full items)
    static toResponse(entity: ImportReceipt): ImportReceiptResponse {
        return {
            id: entity.id,
            code: entity.code,
            warehouse: WarehouseMapper.toResponse(entity.warehouse),
            supplier: entity.supplier ? SupplierMapper.toResponse(entity.supplier) : undefined,
            createdBy: UsersMapper.toDTO(entity.createdByUser),
            totalPrice: entity.totalPrice,
            note: entity.note,
            status: entity.status,
            createdAt: entity.createdAt,
            items: entity.items ? entity.items.map(item => ({
                id: item.id,
                receipt: undefined as any, // Tránh circular reference
                product: ProductMapper.toResponse(item.product),
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                scannedSerials: item.scannedSerials,
            })) : [],
        };
    }

    // Alias cho toResponse (cho dễ đọc)
    static toDetailResponse(entity: ImportReceipt): ImportReceiptResponse {
        return this.toResponse(entity);
    }

    // Response cho table/list view (không cần full relations)
    static toTableResponse(entity: ImportReceipt) {
        return {
            id: entity.id,
            code: entity.code,
            warehouseName: entity.warehouse?.name || '',
            supplierName: entity.supplier?.name || '',
            createdByName: entity.createdByUser?.username || '',
            totalPrice: entity.totalPrice,
            status: entity.status,
            createdAt: entity.createdAt,
            itemsCount: entity.items?.length || 0,
        };
    }

    static toResponseList(entities: ImportReceipt[]): ImportReceiptResponse[] {
        return entities.map(e => this.toResponse(e));
    }

    static toTableResponseList(entities: ImportReceipt[]) {
        return entities.map(e => this.toTableResponse(e));
    }
}
