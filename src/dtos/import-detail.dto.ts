import { IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsArray, IsString } from "class-validator";

export class CreateImportItemDTO {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scannedSerials?: string[];
}