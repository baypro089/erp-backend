import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { SerialStatus } from '@libs/shared/enums/serial-status.enum';
import { ImportReceipt } from './import-receipt.entity';
import { Warehouse } from './warehouse.entity';
import { Order } from './order.entity';

@Entity({ name: 'product_serials' })
export class ProductSerial {

  @PrimaryColumn({ type: 'varchar', name: 'serial_number' })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: SerialStatus,
    default: SerialStatus.AVAILABLE,
  })
  status: SerialStatus;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'uuid', name: 'warehouse_id' })
  warehouseId: string;

  // Đến phiếu nhập nào (nếu có)
  @Column({ type: 'uuid', name: 'import_receipt_id', nullable: true })
  importReceiptId: string | null;

  // Đã bán cho đơn hàng nào (nếu có)
  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  // Ngày nhập kho
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Ngày cập nhật trạng thái
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.productSerials)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.productSerials)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

}
