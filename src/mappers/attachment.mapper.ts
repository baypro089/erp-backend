import { Attachment } from '@/entities/attachment.entity';
import { AttachmentResponse, AttachmentSimpleResponse } from '@libs/shared/types/attachment.type';
import { buildPublicUrl } from '@libs/core/helpers/url.helper';

export class AttachmentMapper {
  /**
   * Map entity to full response
   */
  static toResponse(entity: Attachment): AttachmentResponse {
    return {
      id: entity.id,
      originalName: entity.originalName,
      path: entity.path,
      mimeType: entity.mimeType,
      size: entity.size,
      sizeFormatted: this.formatFileSize(entity.size),
      type: entity.type,
      folder: entity.folder,
      status: entity.status,
      entityType: entity.entityType,
      entityId: entity.entityId,
      uploadedBy: entity.uploadedBy,
      description: entity.description,
      tags: entity.tags,
      metadata: entity.metadata,
      publicUrl: buildPublicUrl(entity.id), // ID-based URL: /api/attachments/view/{id}
      thumbnailPath: entity.thumbnailPath,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map array of entities to responses
   */
  static toResponseList(entities: Attachment[]): AttachmentResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  /**
   * Map to simplified response (cho danh sách)
   */
  static toSimplifiedResponse(entity: Attachment): AttachmentSimpleResponse {
    return {
      id: entity.id,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      size: entity.size,
      sizeFormatted: this.formatFileSize(entity.size),
      type: entity.type,
      publicUrl: buildPublicUrl(entity.id), // ID-based URL: /api/attachments/view/{id}
      createdAt: entity.createdAt,
    };
  }

  /**
   * Map array to simplified responses
   */
  static toSimplifiedResponseList(entities: Attachment[]): AttachmentSimpleResponse[] {
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
}
