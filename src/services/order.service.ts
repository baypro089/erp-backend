import { CreateOrderDTO, FulfillOrderDTO } from "@/dtos/order.dto";
import { OrderDetail } from "@/entities/order-detail.entity";
import { Order } from "@/entities/order.entity";
import { ProductSerial } from "@/entities/product-serial.entity";
import { ProductStock } from "@/entities/product-stock.entity";
import { Product } from "@/entities/product.entity";
import { StockHistory } from "@/entities/stock-history.entity";
import { Customer } from "@/entities/customer.entity";
import { User } from "@/entities/user.entity";
import { OrderRepository } from "@/repositories/order.repository";
import { OrderStatus } from "@libs/shared/enums/order-status.enum";
import { SerialStatus } from "@libs/shared/enums/serial-status.enum";
import { StockChangeType } from "@libs/shared/enums/warehouse-type.enum";
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";


@Injectable()
export class OrderService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly orderRepository: OrderRepository,
        private readonly redisService: RedisService
    ) { }

    // BƯỚC 1: SALE TẠO ĐƠN
    async createOrder(userId: string, dto: CreateOrderDTO) {
        const result = await this.dataSource.transaction(async (manager) => {
            // Validate customer exists
            const customer = await manager.findOne(Customer, { where: { id: dto.customerId } });
            if (!customer) {
                throw new NotFoundException(`Customer with ID ${dto.customerId} does not exist`);
            }

            // Validate user exists
            const user = await manager.findOne(User, { where: { id: userId } });
            if (!user) {
                throw new NotFoundException(`User with ID ${userId} does not exist`);
            }

            let totalAmount = 0;
            const orderItems: OrderDetail[] = [];

            for (const item of dto.items) {
                const product = await manager.findOne(Product, { where: { id: item.productId } });
                if (!product) {
                    throw new NotFoundException(`Product with ID ${item.productId} does not exist`);
                }

                // Check xem tổng tồn kho các nơi có đủ để bán không
                const totalStock = await manager.createQueryBuilder(ProductStock, 'ps')
                    .select('SUM(ps.quantity)', 'sum')
                    .where('ps.product_id = :pid', { pid: item.productId })
                    .getRawOne();

                const availableStock = totalStock?.sum || 0;
                if (availableStock < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product "${product.name}". Available: ${availableStock}, Required: ${item.quantity}`
                    );
                }

                const amount = item.quantity * item.unitPrice;
                totalAmount += amount;

                orderItems.push(manager.create(OrderDetail, {
                    product,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount
                }));
            }

            // Tạo Order Header
            const order = manager.create(Order, {
                code: `SO-${Date.now()}`,
                customer: { id: dto.customerId },
                creator: { id: userId },
                status: OrderStatus.PENDING, // Chờ xuất kho
                shippingAddress: dto.shippingAddress,
                note: dto.note,
                totalAmount,
                items: orderItems
            });

            return manager.save(order);
        });

        // Invalidate order cache after creating new order
        await this.redisService.delByPrefix('orders:list:');

        return result;
    }

    // BƯỚC 2: KHO XUẤT HÀNG (FULFILLMENT)
    async fulfillOrder(userId: string, orderId: string, dto: FulfillOrderDTO) {
        const result = await this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId }, relations: ['items', 'items.product', 'customer']
            });

            if (!order) {
                throw new NotFoundException(`Order with ID ${orderId} not found`);
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new BadRequestException(
                    `Order ${order.code} cannot be fulfilled. Current status: ${order.status} (must be PENDING)`
                );
            }

            for (const fulfillItem of dto.items) {
                const orderItem = order.items.find(i => i.id === fulfillItem.orderItemId);
                if (!orderItem) {
                    throw new BadRequestException(
                        `Order item with ID ${fulfillItem.orderItemId} not found in order ${order.code}`
                    );
                }

                // A. XỬ LÝ SERIAL (Nếu sản phẩm yêu cầu)
                if (orderItem.product.hasSerialNumber) {
                    if (!fulfillItem.scannedSerials || fulfillItem.scannedSerials.length !== orderItem.quantity) {
                        throw new BadRequestException(
                            `Product "${orderItem.product.name}" requires ${orderItem.quantity} serial numbers, but got ${fulfillItem.scannedSerials?.length || 0}`
                        );
                    }

                    // Kiểm tra xem Serial có nằm trong kho này và trạng thái AVAILABLE không?
                    const serialsInDb = await manager.createQueryBuilder(ProductSerial, 'ps')
                        .where('ps.serialNumber IN (:...sns)', { sns: fulfillItem.scannedSerials })
                        .andWhere('ps.warehouse_id = :wId', { wId: dto.warehouseId })
                        .andWhere('ps.status = :status', { status: SerialStatus.AVAILABLE })
                        .getMany();

                    if (serialsInDb.length !== fulfillItem.scannedSerials.length) {
                        throw new BadRequestException(
                            `Some serial numbers are invalid, already sold, or not in the specified warehouse`
                        );
                    }

                    // Đổi trạng thái Serial thành SOLD và gán orderId
                    for (const serial of serialsInDb) {
                        serial.status = SerialStatus.SOLD;
                        serial.orderId = order.id;
                        await manager.save(serial);
                    }

                    // Lưu danh sách Serial đã xuất vào OrderItem để in hóa đơn
                    orderItem.assignedSerials = fulfillItem.scannedSerials;
                    await manager.save(orderItem);
                }

                // B. TRỪ TỒN KHO VẬT LÝ
                const stock = await manager.findOne(ProductStock, {
                    where: { product: { id: orderItem.product.id }, warehouse: { id: dto.warehouseId } }
                });

                if (!stock || stock.quantity < orderItem.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock in warehouse for product "${orderItem.product.name}". Available: ${stock?.quantity || 0}, Required: ${orderItem.quantity}`
                    );
                }

                stock.quantity -= orderItem.quantity;
                await manager.save(stock);

                // C. GHI THẺ KHO (Stock History)
                const history = manager.create(StockHistory, {
                    warehouse: { id: dto.warehouseId },
                    product: { id: orderItem.product.id },
                    type: StockChangeType.EXPORT,
                    changeAmount: -orderItem.quantity, // Trừ đi
                    balanceAfter: stock.quantity,
                    referenceCode: order.code,
                    reason: `Xuất bán đơn hàng ${order.code}`,
                    performer: { id: userId }
                });
                await manager.save(history);
            }

            // Đổi trạng thái Đơn hàng thành SHIPPED
            order.status = OrderStatus.SHIPPED;

            // (Optional) Cộng dồn doanh thu cho khách hàng (totalSpent)
            order.customer.totalSpent = Number(order.customer.totalSpent) + Number(order.totalAmount);
            await manager.save(order.customer);

            return manager.save(order);
        });

        // Invalidate order cache after fulfillment
        await this.redisService.delByPrefix('orders:list:');
        await this.redisService.del(`order:detail:${orderId}`);

        return result;
    }

    async getAllOrdersWithFiltersAndPagination(
        code?: string,
        status?: string,
        dateFrom?: Date,
        dateTo?: Date,
        totalAmountFrom?: number,
        totalAmountTo?: number,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Order[], total: number }> {
        // Generate cache key based on filters
        const cacheKey = `orders:list:${code || 'all'}:${status || 'all'}:${dateFrom?.toISOString() || 'all'}:${dateTo?.toISOString() || 'all'}:${totalAmountFrom || 'all'}:${totalAmountTo || 'all'}:${page || 'all'}:${pageSize || 'all'}`;

        // Try to get from cache first
        const cached = await this.redisService.get<{ items: Order[], total: number }>(cacheKey);
        if (cached) {
            return cached;
        }

        // If not in cache, query from database
        const result = await this.orderRepository.findAllFilteredAndPaged(
            code,
            status,
            dateFrom,
            dateTo,
            totalAmountFrom,
            totalAmountTo,
            page,
            pageSize
        );

        // Save to cache with 5 minutes TTL
        await this.redisService.set(cacheKey, result, 300);

        return result;
    }

    async getOrderById(orderId: string): Promise<Order | null> {
        // Try to get from cache first
        const cacheKey = `order:detail:${orderId}`;
        const cached = await this.redisService.get<Order>(cacheKey);
        if (cached) {
            return cached;
        }

        // If not in cache, query from database
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['customer', 'creator', 'items', 'items.product']
        });

        if (order) {
            // Save to cache with 10 minutes TTL
            await this.redisService.set(cacheKey, order, 600);
        }

        return order;
    }
}