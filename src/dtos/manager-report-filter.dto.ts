import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ManagerReportFilterDTO {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsNumber()
  @Min(2020)
  year?: number; // Ví dụ: 2026
}