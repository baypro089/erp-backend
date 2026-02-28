import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AttachmentRepository } from '@/repositories/attachment.repository';
import { LocalStorageProvider } from './storage.service';
import { Attachment } from '@/entities/attachment.entity';
import {
  UploadFileDTO,
  UpdateAttachmentDTO,
  QueryAttachmentDTO,
} from '@/dtos/attachment.dto';
import {
  AttachmentResponse,
  UploadAttachmentDto,
  UpdateAttachmentDto,
} from '@libs/shared/types/attachment.type';
import { AttachmentStatus } from '@libs/shared/enums/attachment.enum';
import { AttachmentMapper } from '@/mappers/attachment.mapper';
import { DataSource } from 'typeorm';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly storageProvider: LocalStorageProvider,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Upload một file
   */
  async uploadFile(
    file: Express.Multer.File,
    dto: UploadAttachmentDto | UploadFileDTO,
  ): Promise<AttachmentResponse> {
    try {
      // Upload file lên storage
      const uploadResult = await this.storageProvider.upload(file, dto.folder);

      // Lưu metadata vào database
      const attachment = this.attachmentRepository.create({
        originalName: uploadResult.originalName,
        path: uploadResult.path,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        type: uploadResult.type,
        folder: dto.folder,
        status: AttachmentStatus.ACTIVE,
        entityType: dto.entityType,
        entityId: dto.entityId,
        uploadedBy: dto.uploadedBy,
        description: dto.description,
        tags: dto.tags,
        metadata: dto.metadata,
        // publicUrl: null - Không lưu vào DB, sẽ generate khi response
      });

      const savedAttachment = await this.attachmentRepository.save(attachment);

      return AttachmentMapper.toResponse(savedAttachment);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Upload file failed: ${error.message}`,
      );
    }
  }

  /**
   * Upload nhiều file
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: UploadAttachmentDto | UploadFileDTO,
  ): Promise<AttachmentResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results: AttachmentResponse[] = [];

    // Upload từng file
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, dto);
        results.push(result);
      } catch (error) {
        // Log error nhưng tiếp tục upload các file khác
        console.error(`Failed to upload file ${file.originalname}:`, error);
      }
    }

    return results;
  }

  /**
   * Tìm kiếm attachment với filter và phân trang
   */
  async findAll(
    query: QueryAttachmentDTO,
  ): Promise<{ items: AttachmentResponse[]; total: number }> {
    const { items, total } =
      await this.attachmentRepository.findAllFilteredAndPaged(
        query.type,
        query.folder,
        query.status,
        query.entityType,
        query.entityId,
        query.uploadedBy,
        query.search,
        query.page,
        query.pageSize,
      );

    return {
      items: AttachmentMapper.toResponseList(items),
      total,
    };
  }

  /**
   * Tìm attachment theo ID
   */
  async findOne(id: string): Promise<AttachmentResponse> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return AttachmentMapper.toResponse(attachment);
  }

  /**
   * Tìm tất cả attachment của một entity (trả về response)
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AttachmentResponse[]> {
    const attachments = await this.attachmentRepository.findByEntity(
      entityType,
      entityId,
    );

    return AttachmentMapper.toResponseList(attachments);
  }

  /**
   * Tìm tất cả attachment của một entity (trả về entity gốc cho mapper ở controller)
   */
  async findByEntityRaw(
    entityType: string,
    entityId: string,
  ): Promise<Attachment[]> {
    return this.attachmentRepository.findByEntity(entityType, entityId);
  }

  /**
   * Cập nhật thông tin attachment
   */
  async update(
    id: string,
    dto: UpdateAttachmentDto | UpdateAttachmentDTO,
  ): Promise<AttachmentResponse> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Update fields
    if (dto.description !== undefined) {
      attachment.description = dto.description;
    }
    if (dto.tags !== undefined) {
      attachment.tags = dto.tags;
    }
    if (dto.metadata !== undefined) {
      attachment.metadata = dto.metadata;
    }
    if (dto.status !== undefined) {
      attachment.status = dto.status;
    }
    if (dto.entityType !== undefined) {
      attachment.entityType = dto.entityType;
    }
    if (dto.entityId !== undefined) {
      attachment.entityId = dto.entityId;
    }

    const updatedAttachment =
      await this.attachmentRepository.save(attachment);

    return AttachmentMapper.toResponse(updatedAttachment);
  }

  /**
   * Đọc file (trả về buffer)
   */
  async readFile(id: string): Promise<{ buffer: Buffer; attachment: Attachment }> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.status !== AttachmentStatus.ACTIVE) {
      throw new BadRequestException('Attachment is not available');
    }

    const buffer = await this.storageProvider.read(attachment.path);

    return { buffer, attachment };
  }

  /**
   * Đọc file bằng path (relative path)
   */
  async readFileByPath(relativePath: string): Promise<{ buffer: Buffer; attachment: Attachment }> {
    const attachment = await this.attachmentRepository.findOne({
      where: { path: relativePath },
    });

    if (!attachment) {
      throw new NotFoundException('File not found');
    }

    if (attachment.status !== AttachmentStatus.ACTIVE) {
      throw new BadRequestException('File is not available');
    }

    const buffer = await this.storageProvider.read(attachment.path);

    return { buffer, attachment };
  }

  /**
   * Xóa attachment (soft delete)
   */
  async softDelete(id: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Soft delete: Chỉ cập nhật status
    attachment.status = AttachmentStatus.DELETED;
    await this.attachmentRepository.save(attachment);
  }

  /**
   * Xóa attachment vĩnh viễn (hard delete)
   * Xóa cả file và metadata
   */
  async hardDelete(id: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    try {
      // Xóa file khỏi storage
      await this.storageProvider.delete(attachment.path);

      // Xóa thumbnail nếu có
      if (attachment.thumbnailPath) {
        await this.storageProvider.delete(attachment.thumbnailPath);
      }

      // Xóa metadata khỏi database
      await this.attachmentRepository.remove(attachment);
    } catch (error) {
      throw new InternalServerErrorException(
        `Delete attachment failed: ${error.message}`,
      );
    }
  }

  /**
   * Xóa nhiều attachment
   */
  async deleteMultiple(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.hardDelete(id);
    }
  }

  /**
   * Đếm số lượng attachment của entity
   */
  async countByEntity(entityType: string, entityId: string): Promise<number> {
    return this.attachmentRepository.countByEntity(entityType, entityId);
  }

  /**
   * Lấy tổng dung lượng file của user
   */
  async getTotalSizeByUser(uploadedBy: string): Promise<number> {
    return this.attachmentRepository.getTotalSizeByUser(uploadedBy);
  }

  /**
   * Lấy URL công khai của file
   */
  getPublicUrl(path: string): string {
    return this.storageProvider.getPublicUrl(path);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDTO(attachment: Attachment): AttachmentResponse {
    return AttachmentMapper.toResponse(attachment);
  }

  /**
   * Liên kết attachment với entity
   */
  async linkToEntity(
    attachmentId: string,
    entityType: string,
    entityId: string,
  ): Promise<AttachmentResponse> {
    return this.update(attachmentId, { entityType, entityId });
  }

  /**
   * Hủy liên kết attachment với entity
   */
  async unlinkFromEntity(attachmentId: string): Promise<AttachmentResponse> {
    return this.update(attachmentId, {
      entityType: undefined,
      entityId: undefined,
    });
  }
}
