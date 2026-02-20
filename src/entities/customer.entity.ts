import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
// import { Order } from './order.entity'; // Sẽ dùng ở phần Order
import { CustomerTier } from '@libs/shared/enums/customer-tier.enum';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  // Số điện thoại là key quan trọng nhất để tra cứu bảo hành
  @Column({ unique: true, length: 20 })
  phoneNumber: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column('text', { nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: CustomerTier,
    default: CustomerTier.STANDARD
  })
  tier: CustomerTier;

  // Tổng tiền khách đã chi tiêu (Dùng để tự động lên hạng VIP)
  // Sẽ được cộng dồn khi Order chuyển trạng thái COMPLETED
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalSpent: number;

  // Điểm tích lũy (Có thể dùng để trừ tiền cho đơn sau)
  @Column('int', { default: 0 })
  rewardPoints: number;

  @Column('text', { nullable: true })
  note: string; // Ghi chú của Sale (VD: "Khách hay mua trả góp", "Khách khó tính")

  @Column({ default: true })
  isActive: boolean;

  // @OneToMany(() => Order, (order) => order.customer)
  // orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}