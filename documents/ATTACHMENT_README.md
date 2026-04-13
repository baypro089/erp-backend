# Chức năng Attachment - Quản lý File Upload

## Tổng quan

Hệ thống Attachment cho phép upload, lưu trữ và quản lý các loại file từ ảnh, tài liệu đến video, audio. Hệ thống được thiết kế để dễ dàng mở rộng từ local storage lên cloud storage (AWS S3, Google Cloud Storage, Azure Blob Storage...).

## Tính năng

### ✅ Upload File
- Upload đơn file hoặc nhiều file cùng lúc (tối đa 10 files)
- Hỗ trợ đa dạng loại file: ảnh, tài liệu, video, audio, archive...
- Tự động phân loại file theo MIME type
- Giới hạn kích thước file (mặc định 50MB, có thể cấu hình)

### 📁 Phân chia thư mục rõ ràng
Files được lưu trữ theo các thư mục:
- `products` - Hình ảnh sản phẩm
- `employees` - Tài liệu nhân viên (CV, chứng chỉ)
- `customers` - Tài liệu khách hàng
- `orders` - Đơn hàng (hóa đơn, chứng từ)
- `documents` - Tài liệu chung
- `reports` - Báo cáo
- `imports` - Phiếu nhập hàng
- `returns` - Phiếu trả hàng
- `avatars` - Avatar người dùng
- `temp` - Tạm thời

### 🔗 Liên kết với Entity
- Liên kết attachment với bất kỳ entity nào (product, employee, order...)
- Query attachment theo entity
- Đếm số lượng attachment của entity

### 🔍 Tìm kiếm & Filter
- Tìm theo loại file (type)
- Tìm theo thư mục (folder)
- Tìm theo trạng thái (status)
- Tìm theo entity
- Full-text search theo tên file và mô tả
- Phân trang

### 📊 Quản lý
- Cập nhật metadata (description, tags, metadata)
- Soft delete (giữ file, đánh dấu deleted)
- Hard delete (xóa file và metadata)
- Xóa batch nhiều file
- Thống kê dung lượng theo user

## Cấu trúc File

```
src/
├── controllers/
│   └── attachment.controller.ts      # API endpoints
├── services/
│   ├── attachment.service.ts         # Business logic
│   └── storage.service.ts            # Storage provider (local/cloud)
├── repositories/
│   └── attachment.repository.ts      # Database operations
├── entities/
│   └── attachment.entity.ts          # Database entity
├── dtos/
│   └── attachment.dto.ts             # Data transfer objects
├── modules/
│   └── attachment.module.ts          # NestJS module
└── migrations/
    └── 1708617600000-CreateAttachmentsTable.ts

libs/
└── shared/
    ├── enums/
    │   └── attachment.enum.ts        # Enums (Type, Folder, Status)
    └── types/
        └── attachment.type.ts        # Interfaces & Types
```

## API Endpoints

### Upload

#### Upload một file
```http
POST /api/attachments/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- folder: string (required) - Enum: products, employees, customers, etc.
- entityType: string (optional) - VD: "product", "employee"
- entityId: string (optional) - UUID
- description: string (optional)
- tags: string[] (optional)
- uploadedBy: string (optional) - User ID
```

#### Upload nhiều file
```http
POST /api/attachments/upload-multiple
Content-Type: multipart/form-data

Body:
- files: File[] (required, max 10 files)
- folder: string (required)
- entityType: string (optional)
- entityId: string (optional)
- uploadedBy: string (optional)
```

### Query & View

#### Lấy danh sách attachment
```http
GET /api/attachments?type=image&folder=products&page=1&pageSize=20
```

Query params:
- `type`: Loại file (image, document, video, audio, etc.)
- `folder`: Thư mục
- `status`: Trạng thái (active, archived, deleted)
- `entityType`: Loại entity
- `entityId`: ID entity
- `uploadedBy`: ID người upload
- `search`: Tìm kiếm theo tên/mô tả
- `page`: Trang (default: 1)
- `pageSize`: Số item/trang (default: 20)

#### Lấy thông tin attachment
```http
GET /api/attachments/:id
```

#### Xem file (inline - hiển thị trên browser)
```http
GET /api/attachments/view/:id
```

#### Download file
```http
GET /api/attachments/download/:id
```

#### Lấy attachment của entity
```http
GET /api/attachments/entity/:entityType/:entityId
```

VD: `GET /api/attachments/entity/product/uuid-123`

### Update & Manage

#### Cập nhật thông tin
```http
PUT /api/attachments/:id
Content-Type: application/json

{
  "description": "New description",
  "tags": ["tag1", "tag2"],
  "status": "active",
  "metadata": {
    "customField": "value"
  }
}
```

#### Liên kết với entity
```http
PUT /api/attachments/:id/link
Content-Type: application/json

{
  "entityType": "product",
  "entityId": "uuid-123"
}
```

#### Hủy liên kết
```http
PUT /api/attachments/:id/unlink
```

### Delete

#### Xóa (soft delete)
```http
DELETE /api/attachments/:id
```

#### Xóa vĩnh viễn (hard delete)
```http
DELETE /api/attachments/:id/permanent
```

#### Xóa batch
```http
DELETE /api/attachments/batch/delete
Content-Type: application/json

{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Statistics

#### Đếm số attachment của entity
```http
GET /api/attachments/entity/:entityType/:entityId/count
```

#### Tổng dung lượng của user
```http
GET /api/attachments/user/:userId/total-size
```

## Sử dụng trong Code

### 1. Inject AttachmentService

```typescript
import { AttachmentService } from '@/services/attachment.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}

  async getProductWithImages(productId: string) {
    // Lấy thông tin product
    const product = await this.findOne(productId);

    // Lấy danh sách ảnh của product
    const images = await this.attachmentService.findByEntity('product', productId);

    return {
      ...product,
      images,
    };
  }
}
```

### 2. Upload file khi tạo product

```typescript
async createProduct(dto: CreateProductDTO, thumbnailFile?: Express.Multer.File) {
  // Tạo product trước
  const product = await this.productRepository.save({
    name: dto.name,
    // ... other fields
  });

  // Upload thumbnail nếu có
  if (thumbnailFile) {
    const attachment = await this.attachmentService.uploadFile(thumbnailFile, {
      folder: AttachmentFolder.PRODUCTS,
      entityType: 'product',
      entityId: product.id,
      description: 'Product thumbnail',
    });

    // Lưu URL thumbnail vào product
    product.thumbnailUrl = attachment.publicUrl;
    await this.productRepository.save(product);
  }

  return product;
}
```

### 3. Xóa product và tất cả attachments

```typescript
async deleteProduct(productId: string) {
  // Xóa tất cả attachments của product
  const attachments = await this.attachmentService.findByEntity('product', productId);
  const attachmentIds = attachments.map(a => a.id);
  
  if (attachmentIds.length > 0) {
    await this.attachmentService.deleteMultiple(attachmentIds);
  }

  // Xóa product
  await this.productRepository.softDelete(productId);
}
```

## Cấu hình

### Biến môi trường (.env)

```env
# File upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
APP_URL=http://localhost:3000

# Storage (future cloud config)
# STORAGE_TYPE=local # local | s3 | gcs | azure
# AWS_S3_BUCKET=your-bucket
# AWS_REGION=ap-southeast-1
```

## Migration

Chạy migration để tạo bảng `attachments`:

```bash
# Generate migration (nếu cần)
npm run migration:generate -- -n CreateAttachmentsTable

# Run migration
npm run migration:run

# Revert migration
npm run migration:revert
```

## Mở rộng lên Cloud Storage

Hệ thống được thiết kế với interface `IStorageProvider` để dễ dàng mở rộng:

### 1. Tạo S3StorageProvider

```typescript
// services/s3-storage.service.ts
import { Injectable } from '@nestjs/common';
import { IStorageProvider, IUploadResult } from '@/shared/types/attachment.type';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async upload(file: Express.Multer.File, folder: AttachmentFolder): Promise<IUploadResult> {
    const key = `${folder}/${uuid()}${path.extname(file.originalname)}`;
    
    await this.s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }).promise();

    return {
      path: key,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      type: this.getFileType(file.mimetype),
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
    };
  }

  async read(filePath: string): Promise<Buffer> {
    const result = await this.s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filePath,
    }).promise();

    return result.Body as Buffer;
  }

  async delete(filePath: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filePath,
    }).promise();
  }

  getPublicUrl(filePath: string): string {
    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filePath}`;
  }
}
```

### 2. Cập nhật AttachmentModule

```typescript
// modules/attachment.module.ts
import { Module } from '@nestjs/common';
import { LocalStorageProvider } from '@/services/storage.service';
import { S3StorageProvider } from '@/services/s3-storage.service';

const StorageProvider = process.env.STORAGE_TYPE === 's3' 
  ? S3StorageProvider 
  : LocalStorageProvider;

@Module({
  providers: [
    {
      provide: 'IStorageProvider',
      useClass: StorageProvider,
    },
    AttachmentService,
    // ...
  ],
})
export class AttachmentModule {}
```

## Best Practices

### 1. Validation
- Luôn validate file size và MIME type
- Kiểm tra quyền truy cập trước khi cho phép upload/download

### 2. Security
- Scan malware cho uploaded files
- Không cho phép execute uploaded files
- Rate limiting cho upload endpoint

### 3. Performance
- Compress images trước khi lưu
- Tạo thumbnail cho images
- Sử dụng CDN cho public files

### 4. Clean up
- Định kỳ xóa file trong thư mục `temp`
- Cleanup orphaned files (files không có metadata trong DB)
- Archive old files

## Troubleshooting

### Lỗi "File too large"
```
Tăng MAX_FILE_SIZE trong .env
```

### Lỗi "Permission denied" khi write file
```
Kiểm tra quyền write của thư mục uploads/
chmod -R 755 uploads/
```

### Files upload nhưng không hiển thị
```
Kiểm tra public_url trong response
Đảm bảo APP_URL trong .env đúng
```

## License

Copyright © 2025 ERP System
