import { IsOptional, IsString, Matches } from 'class-validator';

export class SalesDashboardFilterDTO {
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,2}$/, { message: 'Tháng phải là số từ 1-12' })
  month?: string; // VD: '2' hoặc '12'

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Năm phải là số 4 chữ số (VD: 2026)' })
  year?: string; // VD: '2026'
}
