import { AttachmentType, AttachmentFolder, AttachmentStatus } from '@libs/shared/enums/attachment.enum';
import { PagedResult } from './pagedResult.type';

/**
 * Response type cho attachment (dùng cho frontend)
 */
export type AttachmentResponse = {
  id: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  sizeFormatted?: string; // VD: "2.5 MB"
  type: AttachmentType;
  folder: AttachmentFolder;
  status: AttachmentStatus;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  publicUrl?: string;
  thumbnailPath?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Response đơn giản cho danh sách
 */
export type AttachmentSimpleResponse = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  sizeFormatted?: string;
  type: AttachmentType;
  publicUrl?: string;
  createdAt: Date;
};

/**
 * Paged result cho attachment
 */
export type PagedAndFilteredAttachment = PagedResult<AttachmentResponse>;

/**
 * DTO cho upload file
 */
export type UploadAttachmentDto = {
  folder: AttachmentFolder;
  entityType?: string;
  entityId?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  uploadedBy?: string;
};

/**
 * DTO cho cập nhật attachment
 */
export type UpdateAttachmentDto = {
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  status?: AttachmentStatus;
  entityType?: string;
  entityId?: string;
};
