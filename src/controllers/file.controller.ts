import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileService } from '@/services/file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /* =========================
     Upload file
     POST /files/upload
  ========================== */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate type (ví dụ: image)
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB');
    }

    const path = await this.fileService.uploadFile(file, 'images');

    return {
      message: 'Upload successful',
      path,
    };
  }

  /* =========================
     Get file
     GET /files/:path
  ========================== */
  @Get(':path')
  async getFile(
    @Param('path') path: string,
    @Res() res: Response,
  ) {
    const file = await this.fileService.readFile(path);

    res.end(file);
  }

  /* =========================
     Delete file
     DELETE /files/:path
  ========================== */
  @Delete(':path')
  async deleteFile(
    @Param('path') path: string,
  ) {
    await this.fileService.deleteFile(path);

    return {
      message: 'File deleted successfully',
    };
  }
}
