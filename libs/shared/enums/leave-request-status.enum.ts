export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED', // User tự hủy trước khi được duyệt
}

export enum LeaveRequestType {
  ANNUAL = 'ANNUAL',   // Phép năm (Thường có lương)
  SICK = 'SICK',       // Nghỉ ốm
  UNPAID = 'UNPAID',   // Không lương (Việc riêng)
  MATERNITY = 'MATERNITY', // Thai sản
  OTHER = 'OTHER',
}
