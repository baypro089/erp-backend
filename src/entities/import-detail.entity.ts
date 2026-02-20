import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { ImportReceipt } from './import-receipt.entity';

@Entity('import_details')
export class ImportDetail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'receipt_id' })
    receiptId: string;

    @Column({ type: 'uuid', name: 'product_id' })
    productId: string;

    @Column('int')
    quantity: number;

    @Column('decimal', { precision: 15, scale: 2 })
    unitPrice: number; // Giá nhập vào (Cost Price)

    @Column('decimal', { precision: 15, scale: 2 })
    amount: number; // = quantity * unitPrice

    // QUAN TRỌNG: Lưu tạm danh sách Serial vừa quét được vào đây
    // Khi trạng thái chuyển sang COMPLETED, list này sẽ được bắn sang bảng ProductSerial
    @Column('jsonb', { nullable: true })
    scannedSerials: string[];

    @ManyToOne(() => ImportReceipt, (receipt) => receipt.items)
    @JoinColumn({ name: 'receipt_id' })
    receipt: ImportReceipt;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;
}