import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsArray,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { AttachmentFolder, AttachmentStatus, AttachmentType } from '@libs/shared/enums/attachment.enum';
import { Type } from 'class-transformer';

/**
 * DTO cho upload file
 */
export class UploadFileDTO {
  @IsEnum(AttachmentFolder)
  folder: AttachmentFolder;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;
}

/**
 * DTO cho upload nhiều file
 */
export class UploadMultipleFilesDTO {
  @IsEnum(AttachmentFolder)
  folder: AttachmentFolder;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;
}

/**
 * DTO cho cập nhật attachment
 */
export class UpdateAttachmentDTO {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(AttachmentStatus)
  status?: AttachmentStatus;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}

/**
 * Query DTO cho tìm kiếm attachment
 */
export class QueryAttachmentDTO {
  @IsOptional()
  @IsEnum(AttachmentType)
  type?: AttachmentType;

  @IsOptional()
  @IsEnum(AttachmentFolder)
  folder?: AttachmentFolder;

  @IsOptional()
  @IsEnum(AttachmentStatus)
  status?: AttachmentStatus;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @IsOptional()
  @IsString()
  search?: string; // Tìm theo tên file hoặc description

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 20;
}

/**
 * Response DTO
 */
export class AttachmentResponseDTO {
  id: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
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
}
