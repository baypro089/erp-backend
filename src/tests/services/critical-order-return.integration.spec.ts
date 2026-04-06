import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DataSource } from 'typeorm';
import { OrderService } from '@/services/order.service';
import { ReturnService } from '@/services/return-request.service';
import { OrderRepository } from '@/repositories/order.repository';
import { ReturnRequestRepository } from '@/repositories/return-request.repository';
import { Attachment } from '@/entities/attachment.entity';
import { Brand } from '@/entities/brand.entity';
import { Category } from '@/entities/category.entity';
import { Customer } from '@/entities/customer.entity';
import { Department } from '@/entities/department.entity';
import { Employee } from '@/entities/employee.entity';
import { Holiday } from '@/entities/holiday.entity';
import { ImportDetail } from '@/entities/import-detail.entity';
import { ImportReceipt } from '@/entities/import-receipt.entity';
import { JobHistory } from '@/entities/job-history.entity';
import { LeaveRequest } from '@/entities/leave-request.entity';
import { OrderDetail } from '@/entities/order-detail.entity';
import { Order } from '@/entities/order.entity';
import { Payslip } from '@/entities/payslip.entity';
import { Permission } from '@/entities/permission.entity';
import { Position } from '@/entities/position.entity';
import { ProductSerial } from '@/entities/product-serial.entity';
import { ProductStock } from '@/entities/product-stock.entity';
import { Product } from '@/entities/product.entity';
import { ResignationRequest } from '@/entities/resignation-request.entity';
import { ReturnItem } from '@/entities/return-item.entity';
import { ReturnRequest } from '@/entities/return-request.entity';
import { Role } from '@/entities/role.entity';
import { SalaryComponent } from '@/entities/salary-component';
import { StockHistory } from '@/entities/stock-history.entity';
import { Supplier } from '@/entities/supplier.entity';
import { SystemSetting } from '@/entities/system-setting';
import { TerminationRequest } from '@/entities/termination-request.entity';
import { User } from '@/entities/user.entity';
import { Warehouse } from '@/entities/warehouse.entity';
import { OrderStatus } from '@libs/shared/enums/order-status.enum';
import { SerialStatus } from '@libs/shared/enums/serial-status.enum';
import { CustomerTier } from '@libs/shared/enums/customer-tier.enum';

function loadDotEnvIfExists(): void {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const idx = line.indexOf('=');
        if (idx <= 0) continue;

        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadDotEnvIfExists();

const requiredDbEnv = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
const hasDbConfig = requiredDbEnv.every((key) => !!process.env[key]);

const describeIfDb = hasDbConfig ? describe : describe.skip;

describeIfDb('Critical flow integration (Order/Return)', () => {
    let dataSource: DataSource;
    let orderService: OrderService;
    let returnService: ReturnService;

    const redisStub = {
        get: jest.fn(async () => null),
        set: jest.fn(async () => undefined),
        del: jest.fn(async () => undefined),
        delByPrefix: jest.fn(async () => undefined),
    };

    const allEntities = [
        Attachment,
        Brand,
        Category,
        Customer,
        Department,
        Employee,
        Holiday,
        ImportDetail,
        ImportReceipt,
        JobHistory,
        LeaveRequest,
        OrderDetail,
        Order,
        Payslip,
        Permission,
        Position,
        ProductSerial,
        ProductStock,
        Product,
        ResignationRequest,
        ReturnItem,
        ReturnRequest,
        Role,
        SalaryComponent,
        StockHistory,
        Supplier,
        SystemSetting,
        TerminationRequest,
        User,
        Warehouse,
    ];

    beforeAll(async () => {
        const schema = `it_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const bootstrapDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: [],
            synchronize: false,
            logging: false,
        });

        await bootstrapDataSource.initialize();
        await bootstrapDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        await bootstrapDataSource.destroy();

        dataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            schema,
            synchronize: true,
            dropSchema: true,
            logging: false,
            entities: allEntities,
        });

        await dataSource.initialize();

        orderService = new OrderService(
            dataSource,
            new OrderRepository(dataSource),
            redisStub as any,
        );

        returnService = new ReturnService(
            dataSource,
            new ReturnRequestRepository(dataSource),
            redisStub as any,
        );
    });

    beforeEach(async () => {
        await dataSource.synchronize(true);
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
        }
    });

    async function seedCoreData() {
        const roleRepo = dataSource.getRepository(Role);
        const userRepo = dataSource.getRepository(User);
        const customerRepo = dataSource.getRepository(Customer);
        const brandRepo = dataSource.getRepository(Brand);
        const categoryRepo = dataSource.getRepository(Category);
        const warehouseRepo = dataSource.getRepository(Warehouse);

        const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

        const role = await roleRepo.save({
            role_code: `ROLE_${suffix}`,
            role_name: `Role ${suffix}`,
        });

        const user = await userRepo.save({
            username: `user_${suffix}`,
            email: `user_${suffix}@example.com`,
            password: 'hash',
            roleCode: role.role_code,
        });

        const customer = await customerRepo.save({
            fullName: `Customer ${suffix}`,
            phoneNumber: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
            email: `customer_${suffix}@example.com`,
            totalSpent: 1000,
            tier: CustomerTier.STANDARD,
            rewardPoints: 0,
            isActive: true,
        });

        const brand = await brandRepo.save({
            name: `Brand ${suffix}`,
        });

        const category = await categoryRepo.save({
            name: `Category ${suffix}`,
            isActive: true,
        });

        const warehouse = await warehouseRepo.save({
            code: `WH_${suffix}`,
            name: `Warehouse ${suffix}`,
            address: 'HN',
            isActive: true,
        });

        return { user, customer, brand, category, warehouse };
    }

    it('rejects fulfillment when scanned serial belongs to another product', async () => {
        const { user, customer, brand, category, warehouse } = await seedCoreData();

        const productRepo = dataSource.getRepository(Product);
        const orderRepo = dataSource.getRepository(Order);
        const stockRepo = dataSource.getRepository(ProductStock);
        const serialRepo = dataSource.getRepository(ProductSerial);

        const productA = await productRepo.save({
            name: 'Laptop A',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 1000,
            stockQuantity: 1,
            warrantyMonths: '12',
            hasSerialNumber: true,
            specifications: {},
            isActive: true,
        });

        const productB = await productRepo.save({
            name: 'Laptop B',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 1200,
            stockQuantity: 1,
            warrantyMonths: '12',
            hasSerialNumber: true,
            specifications: {},
            isActive: true,
        });

        await stockRepo.save({ productId: productA.id, warehouseId: warehouse.id, quantity: 1 });
        await serialRepo.save({
            serialNumber: `SER-${randomUUID()}`,
            productId: productB.id,
            warehouseId: warehouse.id,
            status: SerialStatus.AVAILABLE,
        });

        const order = await orderRepo.save({
            code: `SO-${Date.now()}`,
            customerId: customer.id,
            creatorId: user.id,
            status: OrderStatus.PENDING,
            discountAmount: 0,
            totalAmount: 1000,
            items: [{ productId: productA.id, quantity: 1, unitPrice: 1000, amount: 1000 }],
        });

        const serialOfOtherProduct = await serialRepo.findOneOrFail({ where: { productId: productB.id } });

        await expect(orderService.fulfillOrder(user.id, order.id, {
            warehouseId: warehouse.id,
            items: [{ orderItemId: order.items[0].id, scannedSerials: [serialOfOtherProduct.serialNumber] }],
        })).rejects.toThrow(BadRequestException);
    });

    it('rejects fulfillment when payload does not include all order items', async () => {
        const { user, customer, brand, category, warehouse } = await seedCoreData();

        const productRepo = dataSource.getRepository(Product);
        const orderRepo = dataSource.getRepository(Order);
        const stockRepo = dataSource.getRepository(ProductStock);

        const productA = await productRepo.save({
            name: 'Mouse',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 10,
            stockQuantity: 10,
            warrantyMonths: '12',
            hasSerialNumber: false,
            specifications: {},
            isActive: true,
        });

        const productB = await productRepo.save({
            name: 'Keyboard',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 20,
            stockQuantity: 10,
            warrantyMonths: '12',
            hasSerialNumber: false,
            specifications: {},
            isActive: true,
        });

        await stockRepo.save([{ productId: productA.id, warehouseId: warehouse.id, quantity: 5 }, { productId: productB.id, warehouseId: warehouse.id, quantity: 5 }]);

        const order = await orderRepo.save({
            code: `SO-${Date.now()}`,
            customerId: customer.id,
            creatorId: user.id,
            status: OrderStatus.PENDING,
            discountAmount: 0,
            totalAmount: 30,
            items: [
                { productId: productA.id, quantity: 1, unitPrice: 10, amount: 10 },
                { productId: productB.id, quantity: 1, unitPrice: 20, amount: 20 },
            ],
        });

        await expect(orderService.fulfillOrder(user.id, order.id, {
            warehouseId: warehouse.id,
            items: [{ orderItemId: order.items[0].id }],
        })).rejects.toThrow(BadRequestException);
    });

    it('does not deduct customer totalSpent when cancelling SHIPPED order', async () => {
        const { user, customer, brand, category, warehouse } = await seedCoreData();

        const productRepo = dataSource.getRepository(Product);
        const orderRepo = dataSource.getRepository(Order);

        const product = await productRepo.save({
            name: 'RAM',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 100,
            stockQuantity: 0,
            warrantyMonths: '12',
            hasSerialNumber: false,
            specifications: {},
            isActive: true,
        });

        const order = await orderRepo.save({
            code: `SO-${Date.now()}`,
            customerId: customer.id,
            creatorId: user.id,
            status: OrderStatus.SHIPPED,
            discountAmount: 0,
            totalAmount: 200,
            items: [{ productId: product.id, quantity: 2, unitPrice: 100, amount: 200 }],
        });

        const updated = await orderService.updateOrderStatus(user.id, order.id, OrderStatus.CANCELLED, warehouse.id);
        expect(Number(updated.customer.totalSpent)).toBe(1000);
    });

    it('rejects returning a serial that is already returned before', async () => {
        const { user, customer, brand, category, warehouse } = await seedCoreData();

        const productRepo = dataSource.getRepository(Product);
        const orderRepo = dataSource.getRepository(Order);
        const serialRepo = dataSource.getRepository(ProductSerial);

        const product = await productRepo.save({
            name: 'Laptop Return',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 1500,
            stockQuantity: 1,
            warrantyMonths: '12',
            hasSerialNumber: true,
            specifications: {},
            isActive: true,
        });

        const order = await orderRepo.save({
            code: `SO-${Date.now()}`,
            customerId: customer.id,
            creatorId: user.id,
            status: OrderStatus.DELIVERED,
            discountAmount: 0,
            totalAmount: 1500,
            items: [{ productId: product.id, quantity: 1, unitPrice: 1500, amount: 1500 }],
        });

        const serial = await serialRepo.save({
            serialNumber: `SER-${randomUUID()}`,
            productId: product.id,
            warehouseId: warehouse.id,
            status: SerialStatus.SOLD,
            orderId: order.id,
        });

        await returnService.processReturn(user.id, {
            orderId: order.id,
            warehouseId: warehouse.id,
            reason: 'defective',
            items: [{ productId: product.id, quantity: 1, refundPrice: 100, returnedSerials: [serial.serialNumber] }],
        });

        await expect(returnService.processReturn(user.id, {
            orderId: order.id,
            warehouseId: warehouse.id,
            reason: 'duplicate-return',
            items: [{ productId: product.id, quantity: 1, refundPrice: 100, returnedSerials: [serial.serialNumber] }],
        })).rejects.toThrow(BadRequestException);
    });

    it('rejects non-serial return when cumulative returned quantity exceeds purchased quantity', async () => {
        const { user, customer, brand, category, warehouse } = await seedCoreData();

        const productRepo = dataSource.getRepository(Product);
        const orderRepo = dataSource.getRepository(Order);

        const product = await productRepo.save({
            name: 'SSD 1TB',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 200,
            stockQuantity: 3,
            warrantyMonths: '36',
            hasSerialNumber: false,
            specifications: {},
            isActive: true,
        });

        const order = await orderRepo.save({
            code: `SO-${Date.now()}`,
            customerId: customer.id,
            creatorId: user.id,
            status: OrderStatus.DELIVERED,
            discountAmount: 0,
            totalAmount: 600,
            items: [{ productId: product.id, quantity: 3, unitPrice: 200, amount: 600 }],
        });

        await returnService.processReturn(user.id, {
            orderId: order.id,
            warehouseId: warehouse.id,
            reason: 'first-batch',
            items: [{ productId: product.id, quantity: 2, refundPrice: 200 }],
        });

        await expect(returnService.processReturn(user.id, {
            orderId: order.id,
            warehouseId: warehouse.id,
            reason: 'second-batch-overflow',
            items: [{ productId: product.id, quantity: 2, refundPrice: 200 }],
        })).rejects.toThrow(BadRequestException);
    });

    it('rejects non-serial return when same product appears multiple times and exceeds purchased quantity', async () => {
        const { user, customer, brand, category, warehouse } = await seedCoreData();

        const productRepo = dataSource.getRepository(Product);
        const orderRepo = dataSource.getRepository(Order);

        const product = await productRepo.save({
            name: 'Case Fan',
            sku: `SKU-${randomUUID()}`,
            categoryId: category.id,
            brandId: brand.id,
            retailPrice: 30,
            stockQuantity: 3,
            warrantyMonths: '12',
            hasSerialNumber: false,
            specifications: {},
            isActive: true,
        });

        const order = await orderRepo.save({
            code: `SO-${Date.now()}`,
            customerId: customer.id,
            creatorId: user.id,
            status: OrderStatus.DELIVERED,
            discountAmount: 0,
            totalAmount: 90,
            items: [{ productId: product.id, quantity: 3, unitPrice: 30, amount: 90 }],
        });

        await expect(returnService.processReturn(user.id, {
            orderId: order.id,
            warehouseId: warehouse.id,
            reason: 'duplicate-lines-overflow',
            items: [
                { productId: product.id, quantity: 2, refundPrice: 30 },
                { productId: product.id, quantity: 2, refundPrice: 30 },
            ],
        })).rejects.toThrow(BadRequestException);
    });
});
