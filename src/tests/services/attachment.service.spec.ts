import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentService } from '@/services/attachment.service';
import { AttachmentRepository } from '@/repositories/attachment.repository';
import { LocalStorageProvider } from '@/services/storage.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AttachmentStatus, AttachmentFolder } from '@libs/shared/enums/attachment.enum';

const fakeAttachment = {
    id: 'att1', originalName: 'photo.jpg', path: 'uploads/photo.jpg',
    mimeType: 'image/jpeg', size: 10240, status: AttachmentStatus.ACTIVE,
    entityType: 'employee', entityId: 'e1', tags: ['photo'], thumbnailPath: null,
};

const mockAttachmentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findByEntity: jest.fn(),
    findAllFilteredAndPaged: jest.fn(),
    remove: jest.fn(),
    countByEntity: jest.fn(),
    getTotalSizeByUser: jest.fn(),
};

const mockStorage = {
    upload: jest.fn(),
    read: jest.fn(),
    delete: jest.fn(),
    getPublicUrl: jest.fn(),
};

describe('AttachmentService', () => {
    let service: AttachmentService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttachmentService,
                { provide: AttachmentRepository, useValue: mockAttachmentRepo },
                { provide: LocalStorageProvider, useValue: mockStorage },
                { provide: DataSource, useValue: {} },
            ],
        }).compile();
        service = module.get<AttachmentService>(AttachmentService);
    });

    describe('uploadFile', () => {
        it('should upload file and save attachment metadata', async () => {
            const uploadResult = {
                originalName: 'photo.jpg', path: 'uploads/photo.jpg',
                mimeType: 'image/jpeg', size: 10240, type: 'image',
            };
            mockStorage.upload.mockResolvedValue(uploadResult);
            mockAttachmentRepo.create.mockReturnValue(fakeAttachment);
            mockAttachmentRepo.save.mockResolvedValue(fakeAttachment);

            const fakeFile = { originalname: 'photo.jpg', buffer: Buffer.from('data'), mimetype: 'image/jpeg' } as any;
            const result = await service.uploadFile(fakeFile, {
                folder: AttachmentFolder.EMPLOYEES, entityType: 'employee', entityId: 'e1',
            });
            expect(result).toBeDefined();
            expect(mockStorage.upload).toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on unexpected error', async () => {
            mockStorage.upload.mockRejectedValue(new Error('disk full'));
            const fakeFile = { originalname: 'photo.jpg', buffer: Buffer.from('data') } as any;
            await expect(service.uploadFile(fakeFile, { folder: AttachmentFolder.EMPLOYEES, entityType: 'employee', entityId: 'e1' })).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('uploadMultipleFiles', () => {
        it('should throw BadRequestException if no files provided', async () => {
            await expect(service.uploadMultipleFiles([], { folder: AttachmentFolder.EMPLOYEES } as any)).rejects.toThrow(BadRequestException);
        });

        it('should upload multiple files and return results', async () => {
            const uploadResult = { originalName: 'f.jpg', path: 'p.jpg', mimeType: 'image/jpeg', size: 100, type: 'image' };
            mockStorage.upload.mockResolvedValue(uploadResult);
            mockAttachmentRepo.create.mockReturnValue(fakeAttachment);
            mockAttachmentRepo.save.mockResolvedValue(fakeAttachment);
            const files = [{ originalname: 'f.jpg', buffer: Buffer.from('x') } as any];
            const results = await service.uploadMultipleFiles(files, { folder: AttachmentFolder.EMPLOYEES } as any);
            expect(results.length).toBe(1);
        });
    });

    describe('findOne', () => {
        it('should throw NotFoundException if not found', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue(null);
            await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should return attachment response', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue(fakeAttachment);
            const result = await service.findOne('att1');
            expect(result).toBeDefined();
        });
    });

    describe('readFile', () => {
        it('should throw NotFoundException if not found', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue(null);
            await expect(service.readFile('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if not active', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue({ ...fakeAttachment, status: AttachmentStatus.DELETED });
            await expect(service.readFile('att1')).rejects.toThrow(BadRequestException);
        });

        it('should return buffer and attachment', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue(fakeAttachment);
            mockStorage.read.mockResolvedValue(Buffer.from('image data'));
            const result = await service.readFile('att1');
            expect(result.buffer).toBeDefined();
            expect(result.attachment).toEqual(fakeAttachment);
        });
    });

    describe('softDelete', () => {
        it('should throw NotFoundException if not found', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue(null);
            await expect(service.softDelete('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should set status to DELETED', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue({ ...fakeAttachment });
            mockAttachmentRepo.save.mockResolvedValue({ ...fakeAttachment, status: AttachmentStatus.DELETED });
            await service.softDelete('att1');
            expect(mockAttachmentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: AttachmentStatus.DELETED }));
        });
    });

    describe('hardDelete', () => {
        it('should throw NotFoundException if not found', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue(null);
            await expect(service.hardDelete('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should delete file from storage and DB', async () => {
            mockAttachmentRepo.findOne.mockResolvedValue(fakeAttachment);
            mockStorage.delete.mockResolvedValue(undefined);
            mockAttachmentRepo.remove.mockResolvedValue(undefined);
            await service.hardDelete('att1');
            expect(mockStorage.delete).toHaveBeenCalledWith(fakeAttachment.path);
            expect(mockAttachmentRepo.remove).toHaveBeenCalled();
        });
    });

    describe('findByEntity', () => {
        it('should return mapped attachment list', async () => {
            mockAttachmentRepo.findByEntity.mockResolvedValue([fakeAttachment]);
            const result = await service.findByEntity('employee', 'e1');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('countByEntity', () => {
        it('should return count', async () => {
            mockAttachmentRepo.countByEntity.mockResolvedValue(3);
            const count = await service.countByEntity('employee', 'e1');
            expect(count).toBe(3);
        });
    });
});
