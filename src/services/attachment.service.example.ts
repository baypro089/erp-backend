/**
 * EXAMPLE: Cách sử dụng Attachment Service trong các module khác
 */

import { Injectable } from '@nestjs/common';
import { AttachmentService } from '@/services/attachment.service';
import { AttachmentFolder } from '@libs/shared/enums/attachment.enum';

// ============================================================
// EXAMPLE 1: Upload ảnh sản phẩm khi tạo product
// ============================================================

@Injectable()
export class ProductServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Tạo product với thumbnail
   */
  async createProductWithThumbnail(
    productData: any,
    thumbnailFile?: Express.Multer.File,
  ) {
    // 1. Tạo product trước
    const product = {
      id: 'product-uuid-123',
      name: 'CPU Intel Core i9',
      price: 10000000,
    };

    // 2. Upload thumbnail nếu có
    if (thumbnailFile) {
      const attachment = await this.attachmentService.uploadFile(thumbnailFile, {
        folder: AttachmentFolder.PRODUCTS,
        entityType: 'product',
        entityId: product.id,
        description: 'Product thumbnail',
        tags: ['thumbnail', 'product-image'],
      });

      // 3. Lưu URL vào product
      product['thumbnailUrl'] = attachment.publicUrl;
    }

    return product;
  }

  /**
   * Upload nhiều ảnh cho product
   */
  async uploadProductImages(
    productId: string,
    imageFiles: Express.Multer.File[],
  ) {
    const attachments = await this.attachmentService.uploadMultipleFiles(
      imageFiles,
      {
        folder: AttachmentFolder.PRODUCTS,
        entityType: 'product',
        entityId: productId,
        description: 'Product images',
        tags: ['product-image'],
      },
    );

    return attachments;
  }

  /**
   * Lấy tất cả ảnh của product
   */
  async getProductImages(productId: string) {
    return this.attachmentService.findByEntity('product', productId);
  }

  /**
   * Xóa product và tất cả attachments
   */
  async deleteProduct(productId: string) {
    // 1. Lấy tất cả attachments của product
    const attachments = await this.attachmentService.findByEntity(
      'product',
      productId,
    );

    // 2. Xóa tất cả attachments
    if (attachments.length > 0) {
      const ids = attachments.map((a) => a.id);
      await this.attachmentService.deleteMultiple(ids);
    }

    // 3. Xóa product (implement logic ở đây)
    console.log(`Delete product ${productId}`);
  }
}

// ============================================================
// EXAMPLE 2: Upload CV nhân viên
// ============================================================

@Injectable()
export class EmployeeServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Upload CV và chứng chỉ của nhân viên
   */
  async uploadEmployeeDocuments(
    employeeId: string,
    cv?: Express.Multer.File,
    certificates?: Express.Multer.File[],
  ) {
    const attachments: any[] = [];

    // Upload CV
    if (cv) {
      const cvAttachment = await this.attachmentService.uploadFile(cv, {
        folder: AttachmentFolder.EMPLOYEES,
        entityType: 'employee',
        entityId: employeeId,
        description: 'Employee CV',
        tags: ['cv', 'document'],
      });
      attachments.push(cvAttachment);
    }

    // Upload chứng chỉ
    if (certificates && certificates.length > 0) {
      const certAttachments = await this.attachmentService.uploadMultipleFiles(
        certificates,
        {
          folder: AttachmentFolder.EMPLOYEES,
          entityType: 'employee',
          entityId: employeeId,
          description: 'Employee certificates',
          tags: ['certificate', 'document'],
        },
      );
      attachments.push(...certAttachments);
    }

    return attachments;
  }

  /**
   * Lấy tất cả tài liệu của nhân viên
   */
  async getEmployeeDocuments(employeeId: string) {
    return this.attachmentService.findByEntity('employee', employeeId);
  }
}

// ============================================================
// EXAMPLE 3: Upload hóa đơn cho order
// ============================================================

@Injectable()
export class OrderServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Upload hóa đơn cho order
   */
  async uploadOrderInvoice(orderId: string, invoiceFile: Express.Multer.File) {
    return this.attachmentService.uploadFile(invoiceFile, {
      folder: AttachmentFolder.ORDERS,
      entityType: 'order',
      entityId: orderId,
      description: 'Order invoice',
      tags: ['invoice', 'order-document'],
      metadata: {
        orderNumber: 'ORD-2025-001',
        invoiceDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Lấy hóa đơn của order
   */
  async getOrderInvoices(orderId: string) {
    const attachments = await this.attachmentService.findByEntity(
      'order',
      orderId,
    );

    // Filter chỉ lấy invoice
    return attachments.filter((a) => a.tags?.includes('invoice'));
  }
}

// ============================================================
// EXAMPLE 4: Upload avatar user
// ============================================================

@Injectable()
export class UserServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Upload avatar cho user
   */
  async uploadAvatar(userId: string, avatarFile: Express.Multer.File) {
    // 1. Xóa avatar cũ nếu có
    const oldAvatars = await this.attachmentService.findByEntity('user', userId);
    if (oldAvatars.length > 0) {
      await this.attachmentService.deleteMultiple(
        oldAvatars.map((a) => a.id),
      );
    }

    // 2. Upload avatar mới
    return this.attachmentService.uploadFile(avatarFile, {
      folder: AttachmentFolder.AVATARS,
      entityType: 'user',
      entityId: userId,
      description: 'User avatar',
      tags: ['avatar'],
    });
  }

  /**
   * Lấy avatar của user
   */
  async getAvatar(userId: string) {
    const avatars = await this.attachmentService.findByEntity('user', userId);
    return avatars[0] || null; // Chỉ có 1 avatar
  }
}

// ============================================================
// EXAMPLE 5: Upload file import (Excel/CSV)
// ============================================================

@Injectable()
export class ImportServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Upload file import data
   */
  async uploadImportFile(
    importType: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ) {
    return this.attachmentService.uploadFile(file, {
      folder: AttachmentFolder.IMPORTS,
      entityType: 'import',
      description: `Import ${importType} data`,
      tags: ['import', importType],
      uploadedBy,
      metadata: {
        importType,
        importDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Lấy lịch sử import files
   */
  async getImportHistory(importType?: string) {
    const result = await this.attachmentService.findAll({
      folder: AttachmentFolder.IMPORTS,
      entityType: 'import',
      page: 1,
      pageSize: 50,
    });

    if (importType) {
      // Filter theo import type
      result.items = result.items.filter((item) =>
        item.tags?.includes(importType),
      );
    }

    return result;
  }
}

// ============================================================
// EXAMPLE 6: Upload báo cáo
// ============================================================

@Injectable()
export class ReportServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Tạo và upload báo cáo
   */
  async generateAndUploadReport(
    reportType: string,
    reportData: Buffer,
    fileName: string,
    uploadedBy: string,
  ) {
    // Tạo file object từ buffer
    const file: any = {
      fieldname: 'file',
      originalname: fileName,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: reportData,
      size: reportData.length,
    };

    return this.attachmentService.uploadFile(file, {
      folder: AttachmentFolder.REPORTS,
      entityType: 'report',
      description: `${reportType} report`,
      tags: ['report', reportType],
      uploadedBy,
      metadata: {
        reportType,
        generatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Lấy danh sách báo cáo
   */
  async getReports(reportType?: string, page = 1, pageSize = 20) {
    return this.attachmentService.findAll({
      folder: AttachmentFolder.REPORTS,
      entityType: 'report',
      search: reportType,
      page,
      pageSize,
    });
  }
}

// ============================================================
// EXAMPLE 7: Quản lý storage của user
// ============================================================

@Injectable()
export class StorageServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Kiểm tra storage quota của user
   */
  async checkUserStorageQuota(userId: string) {
    const totalSize = await this.attachmentService.getTotalSizeByUser(userId);
    const totalSizeMB = totalSize / 1024 / 1024;

    // Giả sử quota là 1GB
    const quotaMB = 1024;
    const usedPercent = (totalSizeMB / quotaMB) * 100;

    return {
      totalSize,
      totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
      quotaMB,
      usedPercent: parseFloat(usedPercent.toFixed(2)),
      remaining: parseFloat((quotaMB - totalSizeMB).toFixed(2)),
      isOverQuota: totalSizeMB > quotaMB,
    };
  }

  /**
   * Dọn dẹp file cũ (cleanup job)
   */
  async cleanupOldTempFiles(daysOld = 7) {
    // Lấy tất cả file trong thư mục temp
    const result = await this.attachmentService.findAll({
      folder: AttachmentFolder.TEMP,
      page: 1,
      pageSize: 1000,
    });

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);

    // Xóa file cũ hơn cutoff date
    const filesToDelete = result.items.filter(
      (item) => new Date(item.createdAt) < cutoffDate,
    );

    if (filesToDelete.length > 0) {
      const ids = filesToDelete.map((f) => f.id);
      await this.attachmentService.deleteMultiple(ids);
    }

    return {
      deleted: filesToDelete.length,
      message: `Deleted ${filesToDelete.length} old temp files`,
    };
  }
}

// ============================================================
// EXAMPLE 8: Search & Filter
// ============================================================

@Injectable()
export class SearchServiceExample {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Tìm kiếm attachment theo keyword
   */
  async searchAttachments(keyword: string, page = 1, pageSize = 20) {
    return this.attachmentService.findAll({
      search: keyword,
      page,
      pageSize,
    });
  }

  /**
   * Lấy tất cả ảnh
   */
  async getAllImages(page = 1, pageSize = 20) {
    return this.attachmentService.findAll({
      type: 'image' as any, // AttachmentType.IMAGE
      page,
      pageSize,
    });
  }

  /**
   * Lấy tất cả tài liệu
   */
  async getAllDocuments(page = 1, pageSize = 20) {
    return this.attachmentService.findAll({
      type: 'document' as any, // AttachmentType.DOCUMENT
      page,
      pageSize,
    });
  }
}
