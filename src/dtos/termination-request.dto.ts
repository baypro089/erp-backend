import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateTerminationRequestDto {
  @ApiProperty({ description: "ID nhân viên bị sa thải" })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: "Ngày sa thải chính thức", example: "2026-03-18" })
  @IsDateString()
  @IsNotEmpty()
  terminationDate: Date;

  @ApiProperty({ description: "Lý do sa thải" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  terminationReason: string;

  @ApiPropertyOptional({ description: "Đường dẫn tài liệu liên quan" })
  @IsString()
  @IsOptional()
  document?: string;
}

export class RejectTerminationRequestDto {
  @ApiPropertyOptional({ description: "Ghi chú từ HR khi từ chối" })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateReassignStatusDto {
  @ApiProperty({ description: "Đã hoàn tất bàn giao tài sản hay chưa" })
  @IsBoolean()
  @Type(() => Boolean)
  isReassigned: boolean;
}

export class RestoreTerminationRequestDto {
  @ApiPropertyOptional({ description: "Cho phép bypass kiểm tra nghĩa vụ khi sa thải nhầm" })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  forceRestore?: boolean;

  @ApiPropertyOptional({ description: "Lý do restore (bắt buộc nếu forceRestore = true)" })
  @IsString()
  @IsOptional()
  restoreReason?: string;
}
