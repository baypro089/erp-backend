
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Brand } from './brand.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'uuid', name: 'brand_id' })
  brandId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'import_price' })
  importPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sale_price' })
  salePrice: number;

  @Column({ type: 'int', name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ type: 'varchar', length: 50, name: 'warranty_months' })
  warrantyMonths: string;

  @Column({ nullable: true })
  specs: string;

  @Column({ type: 'varchar', length: 2083, name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;
}
