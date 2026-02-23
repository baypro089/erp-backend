import { AttachmentType, AttachmentFolder, AttachmentStatus } from '@libs/shared/enums/attachment.enum';

/**
 * Interface cho storage provider
 * Cho phép dễ dàng mở rộng sang cloud storage
 */
export interface IStorageProvider {
  /**
   * Upload file lên storage
   */
  upload(file: Express.Multer.File, folder: AttachmentFolder): Promise<IUploadResult>;

  /**
   * Đọc file từ storage
   */
  read(filePath: string): Promise<Buffer>;

  /**
   * Xóa file khỏi storage
   */
  delete(filePath: string): Promise<void>;

  /**
   * Lấy URL công khai của file (nếu có)
   */
  getPublicUrl(filePath: string): string;
}

/**
 * Kết quả sau khi upload
 */
export interface IUploadResult {
  /**
   * Đường dẫn file trong storage
   */
  path: string;

  /**
   * Tên file gốc
   */
  originalName: string;

  /**
   * Kích thước file (bytes)
   */
  size: number;

  /**
   * MIME type
   */
  mimeType: string;

  /**
   * Loại file
   */
  type: AttachmentType;

  /**
   * URL công khai (nếu có)
   */
  publicUrl?: string;
}

/**
 * Options cho upload file
 */
export interface IUploadOptions {
  /**
   * Thư mục lưu trữ
   */
  folder: AttachmentFolder;

  /**
   * Kích thước file tối đa (bytes)
   */
  maxSize?: number;

  /**
   * Các MIME types được phép
   */
  allowedMimeTypes?: string[];

  /**
   * Có nén ảnh không (cho image)
   */
  compressImage?: boolean;

  /**
   * Có tạo thumbnail không (cho image)
   */
  generateThumbnail?: boolean;
}

/**
 * Metadata của attachment
 */
export interface IAttachmentMetadata {
  /**
   * ID entity liên kết (product, employee, order...)
   */
  entityId?: string;

  /**
   * Loại entity
   */
  entityType?: string;

  /**
   * Người upload
   */
  uploadedBy?: string;

  /**
   * Mô tả
   */
  description?: string;

  /**
   * Tags
   */
  tags?: string[];

  /**
   * Metadata tùy chỉnh
   */
  custom?: Record<string, any>;
}
