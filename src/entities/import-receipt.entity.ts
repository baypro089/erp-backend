
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  In,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { Supplier } from './supplier.entity';
import { ProductSerial } from './product-serial.entity';
import { ReceiptStatus } from '@libs/shared/enums/receipt-status.enum';
import { ImportDetail } from './import-detail.entity';
import { User } from './user.entity';

@Entity({ name: 'import_receipts' })
export class ImportReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string; //VD: PN-20260214-001

  @Column({ type: 'uuid', name: 'warehouse_id' })
  warehouseId: string;

  @Column({ type: 'uuid', name: 'supplier_id', nullable: true })
  supplierId: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string;

  @Column('enum', { enum: ReceiptStatus, default: ReceiptStatus.PENDING })
  status: ReceiptStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Danh sách sản phẩm trong phiếu nhập
  @OneToMany(() => ImportDetail, (detail) => detail.receipt, { cascade: true })
  items: ImportDetail[];

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.importReceipts)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Supplier, (supplier) => supplier.importReceipts, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

}
