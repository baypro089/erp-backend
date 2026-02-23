/**
 * Loại file attachment
 */
export enum AttachmentType {
  IMAGE = 'image',           // Hình ảnh (jpg, png, gif, webp, svg)
  DOCUMENT = 'document',     // Tài liệu (pdf, doc, docx, xls, xlsx, ppt, pptx)
  SPREADSHEET = 'spreadsheet', // Bảng tính (xls, xlsx, csv)
  ARCHIVE = 'archive',       // File nén (zip, rar, 7z, tar, gz)
  VIDEO = 'video',           // Video (mp4, avi, mov, wmv)
  AUDIO = 'audio',           // Audio (mp3, wav, ogg, flac)
  TEXT = 'text',             // File text (txt, md, json, xml)
  OTHER = 'other',           // Khác
}

/**
 * Thư mục lưu trữ file theo module
 */
export enum AttachmentFolder {
  PRODUCTS = 'products',           // Hình ảnh sản phẩm
  EMPLOYEES = 'employees',         // Tài liệu nhân viên (CV, chứng chỉ)
  CUSTOMERS = 'customers',         // Tài liệu khách hàng
  ORDERS = 'orders',               // Đơn hàng (hóa đơn, chứng từ)
  DOCUMENTS = 'documents',         // Tài liệu chung
  REPORTS = 'reports',             // Báo cáo
  IMPORTS = 'imports',             // Phiếu nhập hàng
  RETURNS = 'returns',             // Phiếu trả hàng
  TEMP = 'temp',                   // Tạm thời
  AVATARS = 'avatars',             // Avatar người dùng
}

/**
 * Trạng thái file
 */
export enum AttachmentStatus {
  ACTIVE = 'active',               // Đang sử dụng
  ARCHIVED = 'archived',           // Đã lưu trữ
  DELETED = 'deleted',             // Đã xóa (soft delete)
}
