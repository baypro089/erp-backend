import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentController } from '@/controllers/attachment.controller';
import { AttachmentService } from '@/services/attachment.service';
import { LocalStorageProvider } from '@/services/storage.service';
import { AttachmentRepository } from '@/repositories/attachment.repository';
import { Attachment } from '@/entities/attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment])],
  controllers: [AttachmentController],
  providers: [
    AttachmentService,
    AttachmentRepository,
    LocalStorageProvider,
  ],
  exports: [AttachmentService, AttachmentRepository, LocalStorageProvider],
})
export class AttachmentModule {}
