import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
  IStorageProvider,
  IUploadResult,
} from '@libs/shared/types/attachment.type';
import { AttachmentFolder, AttachmentType } from '@libs/shared/enums/attachment.enum';

/**
 * Local Storage Provider
 * Lưu trữ file trên local filesystem
 * Dễ dàng thay thế bằng Cloud Storage Provider sau này
 */
@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadRoot = path.resolve(process.cwd(), 'uploads');

  // Cấu hình MIME types
  private readonly mimeTypeMap: Record<string, AttachmentType> = {
    // Images
    'image/jpeg': AttachmentType.IMAGE,
    'image/jpg': AttachmentType.IMAGE,
    'image/png': AttachmentType.IMAGE,
    'image/gif': AttachmentType.IMAGE,
    'image/webp': AttachmentType.IMAGE,
    'image/svg+xml': AttachmentType.IMAGE,
    'image/bmp': AttachmentType.IMAGE,

    // Documents
    'application/pdf': AttachmentType.DOCUMENT,
    'application/msword': AttachmentType.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      AttachmentType.DOCUMENT,
    'application/vnd.ms-powerpoint': AttachmentType.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      AttachmentType.DOCUMENT,

    // Spreadsheets
    'application/vnd.ms-excel': AttachmentType.SPREADSHEET,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      AttachmentType.SPREADSHEET,
    'text/csv': AttachmentType.SPREADSHEET,

    // Archives
    'application/zip': AttachmentType.ARCHIVE,
    'application/x-rar-compressed': AttachmentType.ARCHIVE,
    'application/x-7z-compressed': AttachmentType.ARCHIVE,
    'application/x-tar': AttachmentType.ARCHIVE,
    'application/gzip': AttachmentType.ARCHIVE,

    // Videos
    'video/mp4': AttachmentType.VIDEO,
    'video/mpeg': AttachmentType.VIDEO,
    'video/quicktime': AttachmentType.VIDEO,
    'video/x-msvideo': AttachmentType.VIDEO,
    'video/x-ms-wmv': AttachmentType.VIDEO,

    // Audio
    'audio/mpeg': AttachmentType.AUDIO,
    'audio/mp3': AttachmentType.AUDIO,
    'audio/wav': AttachmentType.AUDIO,
    'audio/ogg': AttachmentType.AUDIO,
    'audio/flac': AttachmentType.AUDIO,

    // Text
    'text/plain': AttachmentType.TEXT,
    'text/markdown': AttachmentType.TEXT,
    'application/json': AttachmentType.TEXT,
    'application/xml': AttachmentType.TEXT,
    'text/xml': AttachmentType.TEXT,
  };

  constructor() {
    this.ensureDir(this.uploadRoot);
  }

  /**
   * Upload file lên local storage
   */
  async upload(
    file: Express.Multer.File,
    folder: AttachmentFolder,
  ): Promise<IUploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Tạo thư mục theo folder
      const uploadDir = path.join(this.uploadRoot, folder);
      this.ensureDir(uploadDir);

      // Tạo tên file unique
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuid()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      // Lưu file
      await fs.promises.writeFile(filePath, file.buffer);

      // Xác định loại file
      const type = this.getFileType(file.mimetype);

      // Return result (chỉ trả relative path, không trả full URL)
      return {
        path: `${folder}/${fileName}`,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        type,
        publicUrl: undefined, // Không lưu full URL vào DB, sẽ generate khi cần
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Upload file failed: ${error.message}`,
      );
    }
  }

  /**
   * Đọc file từ local storage
   */
  async read(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    try {
      return await fs.promises.readFile(fullPath);
    } catch (error) {
      throw new InternalServerErrorException(
        `Read file failed: ${error.message}`,
      );
    }
  }

  /**
   * Xóa file khỏi local storage
   */
  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      return; // File không tồn tại, không cần xóa
    }

    try {
      await fs.promises.unlink(fullPath);
    } catch (error) {
      throw new InternalServerErrorException(
        `Delete file failed: ${error.message}`,
      );
    }
  }

  /**
   * Lấy URL công khai của file
   * Trong môi trường production, có thể map tới CDN hoặc static file server
   */
  getPublicUrl(filePath: string): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/attachments/view/${filePath}`;
  }

  /**
   * Validate file
   */
  private validateFile(file: Express.Multer.File): void {
    // Kiểm tra file có tồn tại không
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    // Kiểm tra kích thước file (mặc định max 50MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Có thể thêm validation khác như check MIME type allowed...
  }

  /**
   * Xác định loại file dựa trên MIME type
   */
  private getFileType(mimeType: string): AttachmentType {
    return this.mimeTypeMap[mimeType] || AttachmentType.OTHER;
  }

  /**
   * Đảm bảo thư mục tồn tại
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Kiểm tra file có tồn tại không
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.uploadRoot, filePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Lấy thông tin file
   */
  async getFileInfo(filePath: string): Promise<fs.Stats> {
    const fullPath = path.join(this.uploadRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    return fs.promises.stat(fullPath);
  }
}
