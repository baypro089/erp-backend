import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

// DTO 1: Dành cho Sale tạo đơn (Chưa cần Serial)
export class OrderItemDTO {
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
}

export class CreateOrderDTO {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsString()
  shippingProvider?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount: number; // Chiết khấu tổng

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  items: OrderItemDTO[];
}

// DTO 2: Dành cho Kho xuất hàng (Bắt buộc kèm Serial)
export class FulfillItemDTO {
  @IsNotEmpty()
  @IsUUID()
  orderItemId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scannedSerials?: string[];
}

export class FulfillOrderDTO {
  @IsNotEmpty()
  @IsUUID()
  warehouseId: string; // Xuất từ kho nào?

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FulfillItemDTO)
  items: FulfillItemDTO[];
}