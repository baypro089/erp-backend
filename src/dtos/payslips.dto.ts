import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayslipDto {
  @ApiProperty({ description: 'ID của nhân viên', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Tháng (1-12)', example: 1, minimum: 1, maximum: 12 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Năm', example: 2025 })
  @IsInt()
  @IsNotEmpty()
  year: number;

  @ApiProperty({ description: 'Số ngày công chuẩn', example: 26 })
  @IsNumber()
  @IsNotEmpty()
  standardWorkDays: number;

  @ApiProperty({ description: 'Số ngày công thực tế', example: 24 })
  @IsNumber()
  @IsNotEmpty()
  actualWorkDays: number;

  @ApiProperty({ description: 'Tổng lương', example: 15000000 })
  @IsNumber()
  @IsNotEmpty()
  totalSalary: number;

  @ApiProperty({ description: 'Chi tiết bổ sung', required: false })
  @IsString()
  @IsOptional()
  details?: string;
}

export class UpdatePayslipDto extends PartialType(CreatePayslipDto) {}

export class CalculatePayslipDto {
  @ApiProperty({ description: 'ID của nhân viên', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Tháng (1-12)', example: 1, minimum: 1, maximum: 12 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Năm', example: 2025 })
  @IsInt()
  @IsNotEmpty()
  year: number;
}

export class GeneratePayrollDto {
  @ApiProperty({ description: 'Tháng (1-12)', example: 1, minimum: 1, maximum: 12 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Năm', example: 2025 })
  @IsInt()
  @IsNotEmpty()
  year: number;
}

export class MarkPayslipAsPaidDto {
  @ApiProperty({ description: 'ID của phiếu lương', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  payslipId: string;
}
