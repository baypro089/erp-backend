import { CreateOrderDTO, FulfillOrderDTO } from "@/dtos/order.dto";
import { OrderDetail } from "@/entities/order-detail.entity";
import { Order } from "@/entities/order.entity";
import { ProductSerial } from "@/entities/product-serial.entity";
import { ProductStock } from "@/entities/product-stock.entity";
import { Product } from "@/entities/product.entity";
import { StockHistory } from "@/entities/stock-history.entity";
import { Customer } from "@/entities/customer.entity";
import { User } from "@/entities/user.entity";
import { Warehouse } from "@/entities/warehouse.entity";
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

            if (dto.discountAmount > totalAmount) {
                throw new BadRequestException(`Discount amount cannot be greater than total amount`);
            }
            totalAmount = totalAmount - dto.discountAmount;

            // Tạo Order Header
            const order = manager.create(Order, {
                code: `SO-${Date.now()}`,
                customer: { id: dto.customerId },
                creator: { id: userId },
                status: OrderStatus.PENDING, // Chờ xuất kho
                discountAmount: dto.discountAmount,
                shippingProvider: dto.shippingProvider,
                trackingCode: dto.trackingCode,
                shippingAddress: dto.shippingAddress,
                note: dto.note,
                totalAmount,
                items: orderItems
            });

            const savedOrder = await manager.save(order);

            // Reload order with all necessary relations for mapping
            return await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: ['customer', 'creator', 'creator.role', 'creator.employee', 'items', 'items.product', 'items.product.category', 'items.product.brand']
            });
        });

        // Invalidate order cache after creating new order
        await this.redisService.delByPrefix('orders:list:');

        return result as Order;
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

                // Update product's total stockQuantity from all warehouses
                const totalStock = await manager.createQueryBuilder(ProductStock, 'ps')
                    .where('ps.productId = :productId', { productId: orderItem.product.id })
                    .select('SUM(ps.quantity)', 'total')
                    .getRawOne();
                await manager.update(Product, orderItem.product.id, { stockQuantity: totalStock?.total || 0 });

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
            const savedOrder = await manager.save(order);

            // Reload order with all necessary relations for mapping
            return await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: ['customer', 'creator', 'creator.role', 'creator.employee', 'items', 'items.product', 'items.product.category', 'items.product.brand']
            });
        });

        // Invalidate order cache after fulfillment
        await this.redisService.delByPrefix('orders:list:');
        await this.redisService.del(`order:detail:${orderId}`);

        return result as Order;
    }

    async updateOrderStatus(userId: string, orderId: string, status: OrderStatus, warehouseIdToReturn?: string): Promise<Order> {
        const result = await this.dataSource.transaction(async (manager) => {
            // 1. Tìm đơn hàng
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                relations: ['items', 'items.product', 'items.product.category', 'items.product.brand', 'customer']
            });

            if (!order) throw new BadRequestException('Đơn hàng không tồn tại');
            if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Đơn hàng đã được hủy trước đó');
            if (order.status === OrderStatus.DELIVERED) throw new BadRequestException('Đơn hàng đã giao thành công, vui lòng dùng quy trình Trả Hàng (RMA)');

            // 2. KỊCH BẢN 1: Chưa xuất kho (PENDING) -> Hủy đơn (CANCELLED)
            if (order.status === OrderStatus.PENDING && status === OrderStatus.CANCELLED) {
                order.status = status;
            }

            // 3. KỊCH BẢN 2: Đã xuất kho (SHIPPED) -> Giao hàng (DELIVERED)
            if (order.status === OrderStatus.SHIPPED && status === OrderStatus.DELIVERED) {
                order.status = status;
                const currentSpent = Number(order.customer.totalSpent) || 0;
                order.customer.totalSpent = currentSpent + Number(order.totalAmount);
                await manager.save(order.customer);
            }

            // 4. KỊCH BẢN 3: Đã xuất kho (SHIPPED / PROCESSING) -> Hủy đơn (CANCELLED) => Hoàn trả hàng về kho + hoàn tác chi tiêu của khách
            // Bắt buộc phải có warehouseId để biết hàng hoàn về kho nào
            if ((order.status === OrderStatus.SHIPPED || order.status === OrderStatus.PROCESSING) && status === OrderStatus.CANCELLED) {
                if (!warehouseIdToReturn) {
                    throw new BadRequestException('Vui lòng chọn Kho để nhận lại hàng hoàn về!');
                }

                // Validate warehouse tồn tại
                const warehouse = await manager.findOne(Warehouse, {
                    where: { id: warehouseIdToReturn }
                });
                if (!warehouse) {
                    throw new NotFoundException('Không tìm thấy kho nhận hàng hoàn trả');
                }

                for (const item of order.items) {

                    // A. Hoàn trả Serial (Nếu có)
                    if (item.product.hasSerialNumber && item.assignedSerials?.length > 0) {
                        const serials = await manager.createQueryBuilder(ProductSerial, 'ps')
                            .where('ps.serialNumber IN (:...sns)', { sns: item.assignedSerials })
                            .getMany();

                        for (const serial of serials) {
                            serial.status = SerialStatus.AVAILABLE; // Sẵn sàng bán lại
                            serial.warehouse = warehouse; // Đẩy về kho nhận
                            // serial.orderId = null; // Tùy nghiệp vụ: Xóa đi hoặc giữ lại để biết lịch sử
                            await manager.save(serial);
                        }
                    }

                    // B. Hoàn trả Tồn kho (Cộng lại)
                    let stock = await manager.findOne(ProductStock, {
                        where: { product: { id: item.product.id }, warehouse: { id: warehouseIdToReturn } }
                    });

                    if (!stock) {
                        stock = manager.create(ProductStock, {
                            warehouse: { id: warehouseIdToReturn }, product: { id: item.product.id }, quantity: 0
                        });
                    }
                    stock.quantity += item.quantity;
                    await manager.save(stock);

                    // Update product's total stockQuantity from all warehouses
                    const totalStock = await manager.createQueryBuilder(ProductStock, 'ps')
                        .where('ps.productId = :productId', { productId: item.product.id })
                        .select('SUM(ps.quantity)', 'total')
                        .getRawOne();
                    await manager.update(Product, item.product.id, { stockQuantity: totalStock?.total || 0 });

                    // C. Ghi Thẻ kho
                    const history = manager.create(StockHistory, {
                        warehouse: { id: warehouseIdToReturn },
                        product: { id: item.product.id },
                        type: StockChangeType.IMPORT, // Nhập lại
                        changeAmount: item.quantity,
                        balanceAfter: stock.quantity,
                        referenceCode: `CANCEL-${order.code}`,
                        reason: `Hoàn hàng do hủy đơn ${order.code}`,
                        performer: { id: userId }
                    });
                    await manager.save(history);
                }

                // D. Hoàn tác chi tiêu của Khách hàng (đảm bảo không âm)
                if (order.customer) {
                    const currentSpent = Number(order.customer.totalSpent) || 0;
                    const refundAmount = Number(order.totalAmount);
                    order.customer.totalSpent = Math.max(0, currentSpent - refundAmount);
                    await manager.save(order.customer);
                }

                // E. Chốt trạng thái
                order.status = status;
            }

            const savedOrder = await manager.save(order);

            // Reload order with all necessary relations for mapping
            return await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: ['customer', 'creator', 'creator.role', 'creator.employee', 'items', 'items.product', 'items.product.category', 'items.product.brand']
            });
        });

        // Invalidate cache sau khi update status
        await this.redisService.delByPrefix('orders:list:');
        await this.redisService.del(`order:detail:${orderId}`);

        return result as Order;
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
            relations: ['customer', 'creator', 'creator.role', 'creator.employee', 'items', 'items.product', 'items.product.category', 'items.product.brand']
        });

        if (order) {
            // Save to cache with 10 minutes TTL
            await this.redisService.set(cacheKey, order, 600);
        }

        return order;
    }
}