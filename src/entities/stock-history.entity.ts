import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, JoinColumn, RelationId } from "typeorm";
import { Product } from "./product.entity";
import { Warehouse } from "./warehouse.entity";
import { User } from "./user.entity";
import { StockChangeType } from "@libs/shared/enums/warehouse-type.enum";

@Entity('stock_histories')
export class StockHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'product_id' })
    productId: string;

    @Column({ type: 'uuid', name: 'warehouse_id' })
    warehouseId: string;

    @Column({ type: 'enum', enum: StockChangeType })
    type: StockChangeType;

    @Column('int', { name: 'change_amount' })
    changeAmount: number; // Số thay đổi: +10 hoặc -5

    @Column('int', { name: 'balance_after' })
    balanceAfter: number; // Số dư cuối kỳ (Sau khi đổi): 100 -> 110

    @Column('varchar', { nullable: true, length: 100, name: 'reference_code' })
    referenceCode: string; // Mã phiếu liên quan (VD: Mã đơn hàng, Mã phiếu nhập)

    @Column('varchar', { nullable: true, length: 255, name: 'reason' })
    reason: string; // Lý do (VD: "Xuất bán cho khách A")

    @ManyToOne(() => User, { nullable: true })
    performer: User; // Ai làm?

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Product, (product) => product.stockHistories)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Warehouse, (warehouse) => warehouse.stockHistories)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;
}