import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  StreamableFile,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AttachmentService } from '@/services/attachment.service';
import {
  UploadFileDTO,
  UpdateAttachmentDTO,
  QueryAttachmentDTO,
} from '@/dtos/attachment.dto';
import { AttachmentResponse } from '@libs/shared/types/attachment.type';
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { ApiResponse } from '@libs/core/interfaces/apiResponse.interface';
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';

@ApiTags('attachments')
@ApiBearerAuth('access-token')
@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  /**
   * Upload một file
   */
  @Post('upload')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.CREATE)
  @ApiOperation({ summary: 'Upload một file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File cần upload',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ',
          enum: [
            'products',
            'employees',
            'customers',
            'orders',
            'documents',
            'reports',
            'imports',
            'returns',
            'temp',
            'avatars',
          ],
        },
        entityType: {
          type: 'string',
          description: 'Loại entity liên kết',
        },
        entityId: {
          type: 'string',
          description: 'ID của entity',
        },
        description: {
          type: 'string',
          description: 'Mô tả file',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags',
        },
        uploadedBy: {
          type: 'string',
          description: 'ID người upload',
        },
      },
      required: ['file', 'folder'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDTO,
  ): Promise<ApiResponse<AttachmentResponse>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.attachmentService.uploadFile(file, dto);
    return ResponseHelper.send(result, 'Upload file successfully');
  }

  /**
   * Upload nhiều file
   */
  @Post('upload-multiple')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.CREATE)
  @ApiOperation({ summary: 'Upload nhiều file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Các file cần upload (tối đa 10 file)',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ',
        },
        entityType: {
          type: 'string',
          description: 'Loại entity liên kết',
        },
        entityId: {
          type: 'string',
          description: 'ID của entity',
        },
        uploadedBy: {
          type: 'string',
          description: 'ID người upload',
        },
      },
      required: ['files', 'folder'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadFileDTO,
  ): Promise<ApiResponse<AttachmentResponse[]>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    const results = await this.attachmentService.uploadMultipleFiles(files, dto);
    return ResponseHelper.send(results, `Upload ${results.length} file(s) successfully`);
  }

  /**
   * Lấy danh sách attachment với filter và phân trang
   */
  @Get()
  @RequirePermissions(PERMISSIONS.ATTACHMENT.VIEW)
  @ApiOperation({ summary: 'Lấy danh sách attachment' })
  @ApiQuery({ name: 'type', required: false, description: 'Loại file' })
  @ApiQuery({ name: 'folder', required: false, description: 'Thư mục' })
  @ApiQuery({ name: 'status', required: false, description: 'Trạng thái' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Loại entity' })
  @ApiQuery({ name: 'entityId', required: false, description: 'ID entity' })
  @ApiQuery({ name: 'uploadedBy', required: false, description: 'ID người upload' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Số item/trang' })
  async findAll(
    @Query() query: QueryAttachmentDTO,
  ): Promise<ApiResponse<{ items: AttachmentResponse[]; total: number }>> {
    const result = await this.attachmentService.findAll(query);
    return ResponseHelper.send(result, 'Get attachments successfully');
  }

  /**
   * Xem/Download file by ID
   * ĐẶT TRƯỚC @Get(':id') để tránh bị override
   */
  @Get('view/:id')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.VIEW)
  @ApiOperation({ summary: 'Xem hoặc download file theo ID' })
  async viewFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { buffer, attachment } = await this.attachmentService.readFile(id);

    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Download file
   * ĐẶT TRƯỚC @Get(':id') để tránh bị override
   */
  @Get('download/:id')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.VIEW)
  @ApiOperation({ summary: 'Download file' })
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, attachment } = await this.attachmentService.readFile(id);

    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Lấy danh sách attachment của một entity
   * ĐẶT TRƯỚC @Get(':id') để tránh bị override
   */
  @Get('entity/:entityType/:entityId')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.VIEW)
  @ApiOperation({ summary: 'Lấy danh sách attachment của entity' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<ApiResponse<AttachmentResponse[]>> {
    const result = await this.attachmentService.findByEntity(entityType, entityId);
    return ResponseHelper.send(result, 'Get attachments successfully');
  }

  /**
   * Lấy thông tin attachment theo ID
   * ĐẶT SAU tất cả static routes
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.VIEW)
  @ApiOperation({ summary: 'Lấy thông tin attachment theo ID' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<AttachmentResponse>> {
    const result = await this.attachmentService.findOne(id);
    return ResponseHelper.send(result, 'Get attachment successfully');
  }

  /**
   * Cập nhật thông tin attachment
   */
  @Put(':id')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.UPDATE)
  @ApiOperation({ summary: 'Cập nhật thông tin attachment' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAttachmentDTO,
  ): Promise<ApiResponse<AttachmentResponse>> {
    const result = await this.attachmentService.update(id, dto);
    return ResponseHelper.send(result, 'Update attachment successfully');
  }

  /**
   * Liên kết attachment với entity
   */
  @Put(':id/link')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.UPDATE)
  @ApiOperation({ summary: 'Liên kết attachment với entity' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entityType: { type: 'string' },
        entityId: { type: 'string' },
      },
      required: ['entityType', 'entityId'],
    },
  })
  async linkToEntity(
    @Param('id') id: string,
    @Body() body: { entityType: string; entityId: string },
  ): Promise<ApiResponse<AttachmentResponse>> {
    const result = await this.attachmentService.linkToEntity(id, body.entityType, body.entityId);
    return ResponseHelper.send(result, 'Link attachment successfully');
  }

  /**
   * Hủy liên kết attachment với entity
   */
  @Put(':id/unlink')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.UPDATE)
  @ApiOperation({ summary: 'Hủy liên kết attachment với entity' })
  async unlinkFromEntity(
    @Param('id') id: string,
  ): Promise<ApiResponse<AttachmentResponse>> {
    const result = await this.attachmentService.unlinkFromEntity(id);
    return ResponseHelper.send(result, 'Unlink attachment successfully');
  }

  /**
   * Xóa attachment (soft delete)
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.DELETE)
  @ApiOperation({ summary: 'Xóa attachment (soft delete)' })
  async softDelete(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.attachmentService.softDelete(id);
    return ResponseHelper.send(null, 'Delete attachment successfully');
  }

  /**
   * Xóa vĩnh viễn attachment (hard delete)
   */
  @Delete(':id/permanent')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.DELETE)
  @ApiOperation({ summary: 'Xóa vĩnh viễn attachment (hard delete)' })
  async hardDelete(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.attachmentService.hardDelete(id);
    return ResponseHelper.send(null, 'Permanently delete attachment successfully');
  }

  /**
   * Xóa nhiều attachment
   */
  @Delete('batch/delete')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.DELETE)
  @ApiOperation({ summary: 'Xóa nhiều attachment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['ids'],
    },
  })
  async deleteMultiple(
    @Body() body: { ids: string[] },
  ): Promise<ApiResponse<void>> {
    await this.attachmentService.deleteMultiple(body.ids);
    return ResponseHelper.send(null, `Delete ${body.ids.length} attachment(s) successfully`);
  }

  /**
   * Đếm số lượng attachment của entity
   */
  @Get('entity/:entityType/:entityId/count')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.VIEW)
  @ApiOperation({ summary: 'Đếm số lượng attachment của entity' })
  async countByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<ApiResponse<{ count: number }>> {
    const count = await this.attachmentService.countByEntity(entityType, entityId);
    return ResponseHelper.send({ count }, 'Count attachments successfully');
  }

  /**
   * Lấy tổng dung lượng file của user
   */
  @Get('user/:userId/total-size')
  @RequirePermissions(PERMISSIONS.ATTACHMENT.VIEW)
  @ApiOperation({ summary: 'Lấy tổng dung lượng file của user' })
  async getTotalSizeByUser(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<{ totalSize: number; totalSizeMB: number }>> {
    const totalSize = await this.attachmentService.getTotalSizeByUser(userId);
    return ResponseHelper.send(
      {
        totalSize,
        totalSizeMB: parseFloat((totalSize / 1024 / 1024).toFixed(2)),
      },
      'Get total size successfully',
    );
  }
}
