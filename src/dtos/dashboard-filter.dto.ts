import { IsDateString, IsOptional } from 'class-validator';

export class DashboardFilterDTO {
  @IsOptional()
  @IsDateString()
  fromDate?: string; // VD: 2026-02-01

  @IsOptional()
  @IsDateString()
  toDate?: string;   // VD: 2026-02-28
}