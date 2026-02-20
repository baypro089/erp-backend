import { StockAdjustmentDto } from "@/dtos/stock-adjustment.dto";
import { ProductStock } from "@/entities/product-stock.entity";
import { StockHistory } from "@/entities/stock-history.entity";
import { ProductStockRepository } from "@/repositories/product-stock.repository";
import { StockHistoryRepository } from "@/repositories/stock-history.repository";
import { StockChangeType } from "@libs/shared/enums/warehouse-type.enum";
import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";
import { createHash } from 'crypto';
import { Warehouse } from "@/entities/warehouse.entity";
import { Product } from "@/entities/product.entity";

@Injectable()
export class ProductStockService {
    constructor(
        private readonly productStockRepository: ProductStockRepository,
        private readonly stockHistoryRepository: StockHistoryRepository,
        private readonly redisService: RedisService,
        private readonly datasource: DataSource
    ) { }

    // Hàm nội bộ dùng chung cho các Service khác (Nhập/Xuất/Bán hàng)
    // Transactional là bắt buộc để tránh lệch tồn kho
    async updateStock(
        manager: any, // Entity Manager từ Transaction bên ngoài truyền vào
        warehouseId: string,
        productId: string,
        delta: number, // Số thay đổi (+ hoặc -)
        type: StockChangeType,
        referenceCode: string,
        performerId: string,
        reason: string
    ) : Promise<ProductStock> {
        // 1. Tìm bản ghi tồn kho
        let stock = await manager.findOne(ProductStock, {
            where: { warehouse: { id: warehouseId }, product: { id: productId } }, 
            relations: ['warehouse', 'product', 'product.category', 'product.brand']
        });

        // Nếu chưa có (trường hợp nhập lần đầu), tạo mới
        if (!stock) {
            if (delta < 0) throw new BadRequestException('Không thể xuất kho sản phẩm chưa từng nhập!');
            stock = manager.create(ProductStock, {
                warehouse: { id: warehouseId },
                product: { id: productId },
                quantity: 0
            });
        }

        // 2. Kiểm tra logic âm kho
        if (stock.quantity + delta < 0) {
            throw new BadRequestException(`Tồn kho không đủ để xuất! Hiện tại: ${stock.quantity}`);
        }

        // 3. Cập nhật số lượng
        stock.quantity += delta;
        await manager.save(stock);

        // 4. Ghi Thẻ kho (Log)
        const history = manager.create(StockHistory, {
            warehouse: { id: warehouseId },
            product: { id: productId },
            type,
            changeAmount: delta,
            balanceAfter: stock.quantity, // Số dư sau khi đổi
            referenceCode,
            reason,
            performer: { id: performerId }
        });
        await manager.save(history);

        await this.redisService.delByPrefix('product-stock:');
        await this.redisService.delByPrefix('product-stock-history:');

        return stock;
    }

    // API Điều chỉnh kho (Manual Adjustment)
    async manualAdjust(userId: string, dto: StockAdjustmentDto) {
        return this.datasource.transaction(async (manager) => {
            return this.updateStock(
                manager,
                dto.warehouseId,
                dto.productId,
                dto.delta,
                StockChangeType.ADJUSTMENT,
                `ADJ-${Date.now()}`,
                userId,
                dto.reason
            );
        });
    }

    async findAllFilteredAndPaged(
        warehouseId: string,
        search?: string,
        lowStock?: boolean,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: ProductStock[], total: number }> {
        const rawKey = JSON.stringify({ warehouseId, search, lowStock, page: page || 1, pageSize: pageSize || 10 });
        const cacheKey = `product-stock:${createHash('md5').update(rawKey).digest('hex')}`;
        const cached = await this.redisService.get<{ items: ProductStock[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await this.productStockRepository.findAllFilteredAndPaged(
            warehouseId,
            search,
            lowStock,
            page,
            pageSize
        );
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async findAllHistoryByProductAndWarehouse(
        warehouseId: string,
        productId: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: StockHistory[], total: number }> {
        const rawKey = JSON.stringify({ warehouseId, productId, page: page || 1, pageSize: pageSize || 10 });
        const cacheKey = `product-stock-history:${createHash('md5').update(rawKey).digest('hex')}`;
        const cached = await this.redisService.get<{ items: StockHistory[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await this.stockHistoryRepository.findAllByProductAndWarehouse(
            warehouseId,
            productId,
            page,
            pageSize
        );

        await this.redisService.set(cacheKey, result, 300);
        return result;
    }
}