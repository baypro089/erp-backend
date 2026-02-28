import { IsOptional, IsNumber, IsUUID, Min, Max } from 'class-validator';

export class WarehouseReportFilterDTO {
  @IsOptional()
  @IsUUID()
  warehouseId?: string; // Nếu không truyền thì tính tổng tất cả các kho

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsNumber()
  @Min(2020)
  year?: number; 
}