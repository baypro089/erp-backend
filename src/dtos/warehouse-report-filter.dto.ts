import { IsOptional, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class WarehouseReportFilterDTO {
  @IsOptional()
  @IsUUID()
  warehouseId?: string; // Nếu không truyền thì tính tổng tất cả các kho

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  year?: number;
}