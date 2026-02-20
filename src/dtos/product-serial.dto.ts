import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SerialStatus } from '@libs/shared/enums/serial-status.enum';

// DTO Cập nhật trạng thái (Dùng cho NV Bảo hành/Kho)
export class UpdateSerialStatusDTO {
  @IsNotEmpty()
  @IsString()
  serialNumber: string;

  @IsNotEmpty()
  @IsEnum(SerialStatus)
  status: SerialStatus;

  @IsOptional()
  @IsString()
  note?: string; // Ghi chú lý do (VD: Chuyển sang hàng lỗi)
}