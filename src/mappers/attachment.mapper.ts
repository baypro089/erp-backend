import { Attachment } from '@/entities/attachment.entity';
import { AttachmentResponseDTO } from '@/dtos/attachment.dto';

export class AttachmentMapper {
  /**
   * Map entity to response DTO
   */
  static toResponse(entity: Attachment): AttachmentResponseDTO {
    return {
      id: entity.id,
      originalName: entity.originalName,
      path: entity.path,
      mimeType: entity.mimeType,
      size: entity.size,
      type: entity.type,
      folder: entity.folder,
      status: entity.status,
      entityType: entity.entityType,
      entityId: entity.entityId,
      uploadedBy: entity.uploadedBy,
      description: entity.description,
      tags: entity.tags,
      metadata: entity.metadata,
      publicUrl: entity.publicUrl,
      thumbnailPath: entity.thumbnailPath,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map array of entities to response DTOs
   */
  static toResponseList(entities: Attachment[]): AttachmentResponseDTO[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  /**
   * Map to simplified response (for listing)
   */
  static toSimplifiedResponse(entity: Attachment) {
    return {
      id: entity.id,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      size: entity.size,
      type: entity.type,
      publicUrl: entity.publicUrl,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Map array to simplified responses
   */
  static toSimplifiedResponseList(entities: Attachment[]) {
    return entities.map((entity) => this.toSimplifiedResponse(entity));
  }

  /**
   * Format file size to human readable
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Map to response with formatted size
   */
  static toResponseWithFormattedSize(entity: Attachment) {
    return {
      ...this.toResponse(entity),
      sizeFormatted: this.formatFileSize(entity.size),
    };
  }
}
