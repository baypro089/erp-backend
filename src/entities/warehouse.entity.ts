
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductStock } from './product-stock.entity';
import { ImportReceipt } from './import-receipt.entity';
import { WarehouseType } from '@libs/shared/enums/warehouse-type.enum';
import { Employee } from './employee.entity';
import { StockHistory } from './stock-history.entity';
import { ProductSerial } from './product-serial.entity';

@Entity({ name: 'warehouses' })
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  code: string; // Mã định danh (VD: WH-HANOI-01) - Dùng để in tem/quét mã

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  address: string; // Địa chỉ cụ thể (để tính phí ship hoặc điều phối xe)

  @Column({
    type: 'enum',
    enum: WarehouseType,
    default: WarehouseType.CENTRAL
  })
  type: WarehouseType;

  // Người chịu trách nhiệm quản lý kho này (Thủ kho)
  // Logic: Chỉ người này (và Admin) mới được duyệt phiếu nhập/xuất tại kho này
  @ManyToOne(() => Employee, (employee) => employee.managedWarehouses, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ProductStock, (productStock) => productStock.warehouse)
  productStocks: ProductStock[];
  
  @OneToMany(() => ImportReceipt, (importReceipt) => importReceipt.warehouse)
  importReceipts: ImportReceipt[];

  @OneToMany(() => StockHistory, (stockHistory) => stockHistory.warehouse)
  stockHistories: StockHistory[];

  @OneToMany(() => ProductSerial, (productSerial) => productSerial.warehouse)
  productSerials: ProductSerial[];
}
