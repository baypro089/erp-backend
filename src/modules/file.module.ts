import { Module } from '@nestjs/common';
import { FileService } from '@/services/file.service';

@Module({
  controllers: [],
  providers: [FileService],
  exports: [FileService], // nếu module khác cần dùng
})
export class FileModule {}
