export enum Status {
    DRAFT = 'DRAFT',      // Bản nháp (Chưa gửi duyệt)
    ACTIVE = 'ACTIVE',    // Đang làm việc (Được phép đăng nhập và tính lương)
    MATERNITY_LEAVE = 'MATERNITY_LEAVE', // Đang nghỉ thai sản (Vẫn truy cập được, nhưng ko tính lương)
    RESIGNED = 'RESIGNED',       // Đã nghỉ việc (Bị khóa đăng nhập)
    PROBATION = 'PROBATION', // Thử việc (Được phép đăng nhập và tính lương)
    TERMINATED = 'TERMINATED', // Đã bị sa thải (Bị khóa đăng nhập)
}