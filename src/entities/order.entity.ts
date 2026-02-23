import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { OrderDetail } from './order-detail.entity';
import { OrderStatus } from '@libs/shared/enums/order-status.enum';
import { User } from './user.entity';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'uuid', name: 'creator_id' })
  creatorId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number; // Chiết khấu tổng (nếu có)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 255, name: 'shipping_provider', nullable: true })
  shippingProvider: string;

  @Column({ type: 'varchar', length: 255, name: 'shipping_address', nullable: true })
  shippingAddress: string;

  @Column({ type: 'varchar', length: 255, name: 'tracking_code', nullable: true })
  trackingCode: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => OrderDetail, (detail) => detail.order, { cascade: true })
  items: OrderDetail[];
}
