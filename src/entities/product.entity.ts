
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
import { Category } from './category.entity';
import { Brand } from './brand.entity';
import { ProductSerial } from './product-serial.entity';
import { ProductStock } from './product-stock.entity';
import { StockHistory } from './stock-history.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sku: string; // Mã SKU quản lý nội bộ (VD: CPU-INTEL-I9-14900K)

  @Column({ type: 'varchar', length: 255 })
  name: string; // Tên hiển thị (VD: CPU Intel Core i9 14900K)

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'uuid', name: 'brand_id' })
  brandId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sale_price' })
  retailPrice: number; // Giá niêm yết (Giá bán mặc định)

  @Column({ type: 'int', name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ type: 'varchar', length: 50, name: 'warranty_months' })
  warrantyMonths: string; // Thời gian bảo hành (VD: 12 tháng, 6 tháng)

  // Cờ quan trọng: Sản phẩm này có quản lý theo Serial Number không?
  // VD: Laptop, Điện thoại -> TRUE (Quản lý từng cái)
  // VD: Chuột, Bàn phím, Dây cáp -> FALSE (Quản lý theo số lượng)
  @Column({ default: false })
  hasSerialNumber: boolean;

  // Lưu thông số kỹ thuật động (RAM, CPU, Màu sắc...)
  // VD: { "ram": "16GB", "color": "Titan Blue", "storage": "512GB" }
  @Column({ type: 'jsonb', default: {} })
  specifications: Record<string, any>;

  @Column('text', { nullable: true })
  thumbnailUrl: string; // Ảnh đại diện

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => ProductSerial, (productSerial) => productSerial.product)
  productSerials: ProductSerial[];

  @OneToMany(() => ProductStock, (productStock) => productStock.product)
  productStocks: ProductStock[];

  @OneToMany(() => StockHistory, (stockHistory) => stockHistory.product)
  stockHistories: StockHistory[];
}
