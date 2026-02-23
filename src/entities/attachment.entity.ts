import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttachmentType, AttachmentFolder, AttachmentStatus } from '@libs/shared/enums/attachment.enum';

@Entity({ name: 'attachments' })
@Index(['entityType', 'entityId'])
@Index(['folder', 'type'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'original_name' })
  originalName: string; // Tên file gốc

  @Column({ type: 'varchar', length: 500, unique: true })
  path: string; // Đường dẫn file trong storage (VD: products/uuid.jpg)

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType: string; // MIME type (image/jpeg, application/pdf...)

  @Column({ type: 'bigint' })
  size: number; // Kích thước file (bytes)

  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.OTHER,
  })
  type: AttachmentType; // Loại file

  @Column({
    type: 'enum',
    enum: AttachmentFolder,
    default: AttachmentFolder.TEMP,
  })
  folder: AttachmentFolder; // Thư mục lưu trữ

  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.ACTIVE,
  })
  status: AttachmentStatus; // Trạng thái

  // ===== Liên kết với entity khác =====
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'entity_type' })
  entityType: string; // Loại entity liên kết (product, employee, order...)

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId: string; // ID của entity

  // ===== Thông tin người upload =====
  @Column({ type: 'uuid', nullable: true, name: 'uploaded_by' })
  uploadedBy: string; // ID người upload

  // ===== Mô tả & metadata =====
  @Column({ type: 'text', nullable: true })
  description: string; // Mô tả

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]; // Tags để tìm kiếm

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Metadata tùy chỉnh

  // ===== URL công khai (nếu dùng cloud storage) =====
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'public_url' })
  publicUrl: string;

  // ===== Thumbnail (cho image) =====
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'thumbnail_path' })
  thumbnailPath: string; // Đường dẫn thumbnail

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
