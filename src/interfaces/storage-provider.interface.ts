import { AttachmentFolder, AttachmentType } from '@libs/shared/enums/attachment.enum';

export type StorageUploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export interface IUploadResult {
  path: string;
  originalName: string;
  size: number;
  mimeType: string;
  type: AttachmentType;
  publicUrl?: string;
}

export interface IStorageProvider {
  upload(file: StorageUploadFile, folder: AttachmentFolder): Promise<IUploadResult>;
  read(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  getPublicUrl(filePath: string): string;
}
