import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ReturnRequest } from './return-request.entity';
import { Product } from './product.entity';

@Entity('return_items')
export class ReturnItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'return_request_id' })
    returnRequestId: string; // Lưu ID yêu cầu trả hàng để đối chiếu khi xử lý

    @Column({ type: 'uuid', name: 'product_id' })
    productId: string; // Lưu ID sản phẩm để đối chiếu khi xử lý

    @ManyToOne(() => ReturnRequest, (req) => req.items)
    @JoinColumn({ name: 'return_request_id' })
    returnRequest: ReturnRequest;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column('int')
    quantity: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    refundPrice: number; // Tiền hoàn lại cho 1 sản phẩm

    // Danh sách các mã Serial cụ thể khách mang trả
    @Column('jsonb', { nullable: true })
    returnedSerials: string[];
}