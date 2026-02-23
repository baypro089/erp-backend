import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReturnItemDTO } from './return-item.dto';

export class CreateReturnDTO {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUUID()
  warehouseId: string; // Kho nhận hàng (Nên chọn Kho Hàng Lỗi)

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDTO)
  items: ReturnItemDTO[];
}