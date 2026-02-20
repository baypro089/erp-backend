import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, Max, IsEnum } from 'class-validator';

export class StockAdjustmentDto {
  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  // Cho phép số âm (để trừ kho) hoặc dương (cộng kho)
  // Nhưng không được bằng 0
  @IsNumber()
  @Min(-999999999)
  @Max(999999999)
  delta: number; 

  @IsNotEmpty()
  @IsString()
  reason: string; // Bắt buộc phải giải trình lý do chỉnh sửa
}