# Quick Start - Attachment Feature

## 🚀 Cài đặt & Khởi động

### 1. Chạy Migration

```bash
# Migration đã được tạo sẵn
npm run migration:run
```

### 2. Cấu hình .env

```env
# File upload settings
MAX_FILE_SIZE=52428800  # 50MB (bytes)
APP_URL=http://localhost:3000
```

### 3. Khởi động server

```bash
npm run start:dev
```

## 📝 API Examples (Postman/Thunder Client)

### 1. Upload một file

```http
POST http://localhost:3000/api/attachments/upload
Content-Type: multipart/form-data

Body (form-data):
- file: [chọn file]
- folder: products
- entityType: product
- entityId: uuid-123
- description: Product thumbnail
- tags: ["product", "thumbnail"]
```

### 2. Upload nhiều file

```http
POST http://localhost:3000/api/attachments/upload-multiple
Content-Type: multipart/form-data

Body (form-data):
- files: [chọn nhiều file]
- folder: products
- entityId: uuid-123
- entityType: product
```

### 3. Lấy danh sách attachments

```http
GET http://localhost:3000/api/attachments?folder=products&page=1&pageSize=20
```

### 4. Xem file

```http
GET http://localhost:3000/api/attachments/view/{attachmentId}
```

### 5. Lấy attachments của product

```http
GET http://localhost:3000/api/attachments/entity/product/{productId}
```

### 6. Cập nhật thông tin

```http
PUT http://localhost:3000/api/attachments/{attachmentId}
Content-Type: application/json

{
  "description": "Updated description",
  "tags": ["new-tag"]
}
```

### 7. Xóa attachment

```http
DELETE http://localhost:3000/api/attachments/{attachmentId}
```

## 💻 Sử dụng trong Code

### Import AttachmentService

```typescript
import { AttachmentService } from '@/services/attachment.service';
import { AttachmentFolder } from '@libs/shared/enums/attachment.enum';

@Injectable()
export class YourService {
  constructor(
    private readonly attachmentService: AttachmentService,
  ) {}
}
```

### Upload file

```typescript
async uploadFile(file: Express.Multer.File, productId: string) {
  return this.attachmentService.uploadFile(file, {
    folder: AttachmentFolder.PRODUCTS,
    entityType: 'product',
    entityId: productId,
    description: 'Product image',
    tags: ['product', 'image'],
  });
}
```

### Lấy files của entity

```typescript
async getProductImages(productId: string) {
  return this.attachmentService.findByEntity('product', productId);
}
```

### Xóa files

```typescript
async deleteProductImages(productId: string) {
  const images = await this.attachmentService.findByEntity('product', productId);
  const ids = images.map(img => img.id);
  await this.attachmentService.deleteMultiple(ids);
}
```

## 📁 File Structure

```
uploads/
├── products/        # Hình ảnh sản phẩm
├── employees/       # Tài liệu nhân viên
├── customers/       # Tài liệu khách hàng
├── orders/          # Đơn hàng, hóa đơn
├── documents/       # Tài liệu chung
├── reports/         # Báo cáo
├── imports/         # File import
├── returns/         # File trả hàng
├── avatars/         # Avatar
└── temp/            # File tạm
```

## 🎯 Các loại file được hỗ trợ

- **Images**: jpg, png, gif, webp, svg, bmp
- **Documents**: pdf, doc, docx, ppt, pptx
- **Spreadsheets**: xls, xlsx, csv
- **Archives**: zip, rar, 7z, tar, gz
- **Videos**: mp4, avi, mov, wmv
- **Audio**: mp3, wav, ogg, flac
- **Text**: txt, md, json, xml

## 🔗 Swagger API Docs

Truy cập: `http://localhost:3000/api`

## 📚 Xem thêm

- [ATTACHMENT_README.md](./ATTACHMENT_README.md) - Tài liệu đầy đủ
- [attachment.service.example.ts](./src/services/attachment.service.example.ts) - Code examples

## ⚡ Tips

1. **Kiểm tra quota**: Giới hạn dung lượng upload của user
2. **Cleanup temp files**: Định kỳ xóa file trong thư mục temp
3. **Compress images**: Nén ảnh trước khi lưu để tiết kiệm dung lượng
4. **Security**: Validate file type trước khi upload
5. **CDN**: Sử dụng CDN cho public files để tăng tốc độ

## 🐛 Troubleshooting

### Lỗi "Cannot find module '@libs/shared/enums/attachment.enum'"

```bash
# Build lại project
npm run build
```

### File upload nhưng không xem được

- Kiểm tra APP_URL trong .env
- Kiểm tra quyền thư mục uploads/

### Lỗi "File too large"

- Tăng MAX_FILE_SIZE trong .env
- Kiểm tra cấu hình nginx/apache nếu deploy

## 📞 Support

Kiểm tra file example để biết thêm chi tiết: `src/services/attachment.service.example.ts`
