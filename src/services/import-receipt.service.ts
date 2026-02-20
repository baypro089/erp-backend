import { ImportReceiptRepository } from "@/repositories/import-receipt.repository";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";
import { CreateImportReceiptDTO } from "@/dtos/import-receipt.dto";
import { ImportDetail } from "@/entities/import-detail.entity";
import { Product } from "@/entities/product.entity";
import { ImportReceipt } from "@/entities/import-receipt.entity";
import { ReceiptStatus } from "@libs/shared/enums/receipt-status.enum";
import { SerialStatus } from "@libs/shared/enums/serial-status.enum";
import { ProductSerial } from "@/entities/product-serial.entity";
import { StockHistory } from "@/entities/stock-history.entity";
import { StockChangeType } from "@libs/shared/enums/warehouse-type.enum";
import { ProductStock } from "@/entities/product-stock.entity";
import { Warehouse } from "@/entities/warehouse.entity";
import { createHash } from 'crypto';

@Injectable()
export class ImportReceiptService {
    constructor(
        private readonly importReceiptRepository: ImportReceiptRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    // 1. Tạo Phiếu Nhập và hoàn thành ngay
    async createImportReceipt(userId: string, dto: CreateImportReceiptDTO) {
        return this.dataSource.transaction(async (manager) => {
            // Khai báo repository trong transaction
            const importReceiptRepo = manager.getRepository(ImportReceipt);
            const productRepo = manager.getRepository(Product);
            const importDetailRepo = manager.getRepository(ImportDetail);
            const warehouseRepo = manager.getRepository(Warehouse);

            // Validate warehouse tồn tại
            const warehouse = await warehouseRepo.findOne({ where: { id: dto.warehouseId } });
            if (!warehouse) throw new NotFoundException(`Kho ID ${dto.warehouseId} không tồn tại`);

            // Tính tổng tiền
            let totalAmount = 0;
            const itemsEntities: ImportDetail[] = [];

            for (const itemDto of dto.items) {
                const product = await productRepo.findOne({ where: { id: itemDto.productId } });
                if (!product) throw new NotFoundException(`Sản phẩm ID ${itemDto.productId} không tồn tại`);

                // Validate Serial Logic
                if (product.hasSerialNumber) {
                    if (!itemDto.scannedSerials || itemDto.scannedSerials.length !== itemDto.quantity) {
                        throw new BadRequestException(`Sản phẩm ${product.name} yêu cầu nhập đủ ${itemDto.quantity} mã Serial.`);
                    }
                    // Check trùng Serial trong chính request này
                    const uniqueSerials = new Set(itemDto.scannedSerials);
                    if (uniqueSerials.size !== itemDto.scannedSerials.length) {
                        throw new BadRequestException(`Phát hiện mã Serial trùng lặp trong danh sách nhập của ${product.name}`);
                    }
                }

                const amount = itemDto.quantity * itemDto.unitPrice;
                totalAmount += amount;

                const itemEntity = importDetailRepo.create({
                    product,
                    quantity: itemDto.quantity,
                    unitPrice: itemDto.unitPrice,
                    amount,
                    scannedSerials: itemDto.scannedSerials || []
                });
                itemsEntities.push(itemEntity);
            }

            // Lưu Header với code unique hơn
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const request = importReceiptRepo.create({
                code: `PN-${Date.now()}-${randomSuffix}`,
                warehouse: { id: dto.warehouseId },
                createdByUser: { id: userId },
                status: ReceiptStatus.COMPLETED,
                totalPrice: totalAmount,
                items: itemsEntities,
                note: dto.note
            });

            const savedRequest = await importReceiptRepo.save(request);

            // Load relations trước khi xử lý stock
            const fullRequest = await importReceiptRepo.findOne({
                where: { id: savedRequest.id },
                relations: ['items', 'items.product', 'warehouse', 'createdByUser', 'createdByUser.role', 'items.product.category', 'items.product.brand']
            });

            if (!fullRequest) {
                throw new NotFoundException('Không tìm thấy phiếu nhập vừa tạo');
            }

            // --- CHẠY LOGIC NHẬP KHO ---
            await this.executeStockIn(manager, fullRequest);

            // Invalidate related caches (list / filtered queries)
            await this.redisService.delByPrefix('import_receipts:');

            return fullRequest;
        });
    }

    // Logic cộng tồn kho + tạo serial (Private method)
    private async executeStockIn(manager: any, request: ImportReceipt) {
        //Khai báo repository trong transaction
        const productStockRepo = manager.getRepository(ProductStock);
        const productSerialRepo = manager.getRepository(ProductSerial);
        const stockHistoryRepo = manager.getRepository(StockHistory);

        // Duyệt qua từng item để cập nhật kho và tạo serial
        for (const item of request.items) {
            // A. Cộng Tồn kho (ProductStock)
            let stock = await productStockRepo.findOne({
                where: { warehouse: { id: request.warehouse.id }, product: { id: item.product.id } }
            });

            if (!stock) {
                stock = productStockRepo.create({
                    warehouse: { id: request.warehouse.id },
                    product: { id: item.product.id },
                    quantity: 0
                });
            }
            stock.quantity += item.quantity;
            await productStockRepo.save(stock);

            // B. Ghi Lịch sử (StockHistory)
            const history = stockHistoryRepo.create({
                warehouse: { id: request.warehouse.id },
                product: { id: item.product.id },
                type: StockChangeType.IMPORT,
                changeAmount: item.quantity,
                balanceAfter: stock.quantity,
                referenceCode: request.code,
                reason: 'Nhập kho hàng mới',
                performer: request.createdByUser
            });
            await stockHistoryRepo.save(history);

            // C. Tạo Serial (ProductSerial) - Nếu có
            if (item.scannedSerials && item.scannedSerials.length > 0) {
                // Cần check xem Serial đã tồn tại trong DB chưa (Global Check)
                const existingSerials = await productSerialRepo.createQueryBuilder('ps')
                    .where('ps.serialNumber IN (:...sns)', { sns: item.scannedSerials })
                    .getMany();

                if (existingSerials.length > 0) {
                    throw new BadRequestException(`Mã Serial ${existingSerials[0].serialNumber} đã tồn tại trong hệ thống!`);
                }

                const serialEntities = item.scannedSerials.map(sn => productSerialRepo.create({
                    serialNumber: sn,
                    product: { id: item.product.id },
                    warehouse: { id: request.warehouse.id },
                    status: SerialStatus.AVAILABLE,
                    importReceiptId: request.id
                }));
                await productSerialRepo.save(serialEntities);
            }
        }
    }

    async getAllImportReceipts(
        code?: string,
        warehouseId?: string,
        dateFrom?: Date,
        dateTo?: Date,
        totalPriceFrom?: number,
        totalPriceTo?: number,
        status?: ReceiptStatus,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: ImportReceipt[], total: number }> {
        const rawKey = JSON.stringify({ code, warehouseId, dateFrom, dateTo, totalPriceFrom, totalPriceTo, status, page: page || 1, pageSize: pageSize || 10 });
        const cacheKey = `import_receipts:${createHash('md5').update(rawKey).digest('hex')}`;
        const cached = await this.redisService.get<{ items: ImportReceipt[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await this.importReceiptRepository.findAllWithFilteredAndPaged(code, warehouseId, dateFrom, dateTo, totalPriceFrom, totalPriceTo, status, page, pageSize);
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async getImportReceiptById(id: string): Promise<ImportReceipt> {
        const cacheKey = `import_receipt:${id}`;
        const cached = await this.redisService.get<ImportReceipt>(cacheKey);
        if (cached) return cached;

        const request = await this.importReceiptRepository.findOne({
            where: { id }, 
            relations: ['warehouse', 'supplier', 'createdByUser', 'createdByUser.role', 'items', 'items.product', 'items.product.category', 'items.product.brand']
        });
        if (!request) {
            throw new NotFoundException(`Không tìm thấy phiếu nhập với ID ${id}`);
        }

        await this.redisService.set(cacheKey, request, 300);
        return request;
    }
}