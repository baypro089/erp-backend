import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested, IsNumber, Min, IsInt, ArrayMinSize } from "class-validator";

export class ImportDetailItemDTO {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Đơn giá không được âm' })
  unitPrice: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scannedSerials?: string[];
}

export class CreateImportReceiptDTO {
  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => ImportDetailItemDTO)
  items: ImportDetailItemDTO[];
}