import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Customer } from './customer.entity';
import { Warehouse } from './warehouse.entity';
import { User } from './user.entity';
import { ReturnItem } from './return-item.entity';
import { ReturnStatus } from '@libs/shared/enums/return-status.enum';

@Entity('return_requests')
export class ReturnRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string; // VD: RMA-20260221-001

    @Column({ type: 'uuid', name: 'order_id' })
    orderId: string; // Lưu ID đơn hàng gốc để đối chiếu khi xử lý

    @Column({ type: 'uuid', name: 'customer_id' })
    customerId: string; // Lưu ID khách hàng để đối chiếu khi xử lý

    @Column({ type: 'uuid', name: 'warehouse_id' })
    warehouseId: string; // Lưu ID kho nhận hàng trả về để đối chiếu khi xử lý

    @Column({ type: 'uuid', name: 'creator_id' })
    creatorId: string; // Lưu ID nhân viên tiếp nhận để đối chiếu khi xử lý

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order; // Link tới đơn hàng gốc để đối chiếu

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    // Kho nhận hàng trả về (Thường là kho kỹ thuật/kho lỗi)
    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'creator_id' })
    creator: User; // Nhân viên tiếp nhận

    @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.COMPLETED })
    status: ReturnStatus; // MVP cho COMPLETED luôn để trừ kho ngay

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    refundAmount: number; // Tổng tiền hoàn lại cho khách (Nếu là trả hàng hoàn tiền)

    @Column('varchar', { length: 500 })
    reason: string; // Lý do trả: "VGA không lên hình", "Màn hình bị điểm chết"

    @OneToMany(() => ReturnItem, (item) => item.returnRequest, { cascade: true })
    items: ReturnItem[];

    @CreateDateColumn()
    createdAt: Date;
}