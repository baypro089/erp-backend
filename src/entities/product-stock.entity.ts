import { Entity, Unique, PrimaryGeneratedColumn, ManyToOne, Column, UpdateDateColumn, JoinColumn } from "typeorm";
import { Product } from "./product.entity";
import { Warehouse } from "./warehouse.entity";

@Entity('product_stocks')
@Unique(['product', 'warehouse']) // Một sản phẩm ở 1 kho chỉ có 1 dòng
export class ProductStock {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'product_id' })
    productId: string;

    @Column({ type: 'uuid', name: 'warehouse_id' })
    warehouseId: string;

    @Column('int', { default: 0 })
    quantity: number; // Tổng tồn (VD: 50)

    // Cấu hình cảnh báo (Optional)
    @Column('int', { default: 10 })
    minStockLevel: number; // Mức tồn tối thiểu (Dưới mức này thì báo động đỏ để nhập hàng)

    @UpdateDateColumn()
    lastUpdated: Date;

    @ManyToOne(() => Product, (product) => product.productStocks)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Warehouse, (warehouse) => warehouse.productStocks)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;
}