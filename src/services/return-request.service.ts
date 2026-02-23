import { CreateReturnDTO } from "@/dtos/return-request.dto";
import { Order } from "@/entities/order.entity";
import { ProductSerial } from "@/entities/product-serial.entity";
import { ProductStock } from "@/entities/product-stock.entity";
import { Product } from "@/entities/product.entity";
import { ReturnItem } from "@/entities/return-item.entity";
import { ReturnRequest } from "@/entities/return-request.entity";
import { StockHistory } from "@/entities/stock-history.entity";
import { Warehouse } from "@/entities/warehouse.entity";
import { ReturnRequestRepository } from "@/repositories/return-request.repository";
import { ReturnStatus } from "@libs/shared/enums/return-status.enum";
import { SerialStatus } from "@libs/shared/enums/serial-status.enum";
import { StockChangeType } from "@libs/shared/enums/warehouse-type.enum";
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";


@Injectable()
export class ReturnService {
    private readonly CACHE_PREFIX = 'return-requests:list';
    private readonly CACHE_TTL = 300; // 5 minutes

    constructor(
        private dataSource: DataSource,
        private returnRequestRepository: ReturnRequestRepository,
        private redisService: RedisService,
    ) { }

    async processReturn(userId: string, dto: CreateReturnDTO): Promise<ReturnRequest> {
        return this.dataSource.transaction(async (manager) => {
            // 1. Kiểm tra đơn hàng gốc
            const order = await manager.findOne(Order, {
                where: { id: dto.orderId },
                relations: ['customer']
            });
            if (!order) throw new NotFoundException('Không tìm thấy đơn hàng gốc');

            // 2. Kiểm tra kho nhận hàng tồn tại
            const warehouse = await manager.findOne(Warehouse, {
                where: { id: dto.warehouseId }
            });
            if (!warehouse) throw new NotFoundException('Không tìm thấy kho nhận hàng');

            let totalRefund = 0;
            const returnItems: ReturnItem[] = [];

            // 3. Xử lý từng món hàng bị trả lại
            for (const itemDto of dto.items) {
                const product = await manager.findOne(Product, { where: { id: itemDto.productId } });
                if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

                totalRefund += (itemDto.refundPrice || 0) * itemDto.quantity;

                // A. XỬ LÝ SERIAL (Kiểm chứng gian lận)
                if (product.hasSerialNumber) {
                    if (!itemDto.returnedSerials || itemDto.returnedSerials.length !== itemDto.quantity) {
                        throw new BadRequestException(`Vui lòng quét đủ ${itemDto.quantity} mã Serial để trả hàng.`);
                    }

                    // Query DB xem những Serial này có đúng là của Đơn hàng này không?
                    const serialsInDb = await manager.createQueryBuilder(ProductSerial, 'ps')
                        .where('ps.serialNumber IN (:...sns)', { sns: itemDto.returnedSerials })
                        .andWhere('ps.order_id = :oId', { oId: order.id }) // Điều kiện sống còn: Phải mua ở đơn này
                        .getMany();

                    if (serialsInDb.length !== itemDto.returnedSerials.length) {
                        throw new BadRequestException('Mã Serial không hợp lệ hoặc không thuộc đơn hàng này!');
                    }

                    // Cập nhật trạng thái Serial: Đã bán (SOLD) -> Lỗi/Bảo hành (DEFECTIVE)
                    // Và chuyển vị trí của nó về Kho Lỗi (warehouseId)
                    for (const serial of serialsInDb) {
                        serial.status = SerialStatus.DEFECTIVE;
                        serial.warehouse = warehouse;
                        // serial.orderId vẫn giữ nguyên để biết lịch sử nó từng được mua ở đâu
                        await manager.save(serial);
                    }
                }

                // B. CẬP NHẬT TỒN KHO VẬT LÝ (Tăng tồn kho ở Kho Nhận - Kho Lỗi)
                let stock = await manager.findOne(ProductStock, {
                    where: { product: { id: product.id }, warehouse: { id: dto.warehouseId } }
                });

                if (!stock) {
                    stock = manager.create(ProductStock, {
                        warehouse: { id: dto.warehouseId },
                        product: { id: product.id },
                        quantity: 0
                    });
                }
                stock.quantity += itemDto.quantity;
                await manager.save(stock);

                // C. GHI THẺ KHO (Lịch sử)
                const history = manager.create(StockHistory, {
                    warehouse: { id: dto.warehouseId },
                    product: { id: product.id },
                    type: StockChangeType.IMPORT, // Nhập lại vào kho
                    changeAmount: itemDto.quantity,
                    balanceAfter: stock.quantity,
                    referenceCode: `RMA-${order.code}`, // Liên kết với mã RMA
                    reason: `Khách trả hàng/Bảo hành. Lý do: ${dto.reason}`,
                    performer: { id: userId }
                });
                await manager.save(history);

                // Tạo Entity ReturnItem
                returnItems.push(manager.create(ReturnItem, {
                    product,
                    quantity: itemDto.quantity,
                    refundPrice: itemDto.refundPrice || 0,
                    returnedSerials: itemDto.returnedSerials || []
                }));
            }

            // 4. Lưu Header của Phiếu Trả Hàng
            const returnCode = `RMA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
            const returnRequest = manager.create(ReturnRequest, {
                code: returnCode,
                order,
                customer: order.customer,
                warehouse,
                creator: { id: userId },
                status: ReturnStatus.COMPLETED,
                refundAmount: totalRefund,
                reason: dto.reason,
                items: returnItems
            });

            // 5. Nếu có hoàn tiền, trừ lại tổng chi tiêu của khách hàng (với validation)
            if (totalRefund > 0) {
                const currentSpent = Number(order.customer.totalSpent) || 0;
                // Đảm bảo totalSpent không âm
                order.customer.totalSpent = Math.max(0, currentSpent - totalRefund);
                await manager.save(order.customer);
            }

            const savedReturnRequest = await manager.save(returnRequest);

            // 6. Invalidate cache sau khi tạo return request mới
            await this.redisService.delByPrefix(this.CACHE_PREFIX);

            return savedReturnRequest;
        });
    }

    async getAllReturns(
        code?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: ReturnRequest[], total: number }> {
        // Tạo cache key từ các tham số
        const cacheKey = `${this.CACHE_PREFIX}:${code || 'all'}:${page || 'all'}:${pageSize || 'all'}`;

        // Kiểm tra cache trước
        const cached = await this.redisService.get<{ items: ReturnRequest[], total: number }>(cacheKey);
        if (cached) {
            return cached;
        }

        // Nếu không có cache, query database
        const result = await this.returnRequestRepository.findAllFilteredAndPaged(code, page, pageSize);

        // Lưu vào cache với TTL
        await this.redisService.set(cacheKey, result, this.CACHE_TTL);

        return result;
    }

    async getReturnRequestById(id: string): Promise<ReturnRequest> {
        const returnRequest = await this.returnRequestRepository.findOne({
            where: { id },
            relations: ['order', 'customer', 'warehouse', 'creator', 'items', 'items.product']
        });
        if (!returnRequest) {
            throw new NotFoundException('Không tìm thấy phiếu trả hàng');
        }
        return returnRequest;
    }
}