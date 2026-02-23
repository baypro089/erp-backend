import { IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsArray, IsString } from "class-validator";

export class ReturnItemDTO {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  refundPrice: number; // Có thể = 0 nếu chỉ bảo hành, không hoàn tiền

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  returnedSerials?: string[];
}