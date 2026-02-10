export enum ResignationStatus {
  PENDING = 'PENDING',           // Mới nộp
  APPROVED = 'APPROVED',         // HR đã duyệt (Đang trong thời gian bàn giao)
  REJECTED = 'REJECTED',         // Từ chối (Níu kéo thành công)
  COMPLETED = 'COMPLETED',       // Đã nghỉ hẳn (Hệ thống đã khóa nick)
  CANCELLED = 'CANCELLED'        // Nhân viên rút đơn
}