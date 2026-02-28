import { IsOptional, IsString, Matches } from 'class-validator';

export class HrDashboardFilterDTO {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Định dạng tháng phải là YYYY-MM (VD: 2026-02)' })
  month?: string; // Mặc định lấy tháng hiện tại nếu không truyền
}