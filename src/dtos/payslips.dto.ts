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

export class CreatePayslipDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsNotEmpty()
  standardWorkDays: number;

  @IsNumber()
  @IsNotEmpty()
  actualWorkDays: number;

  @IsNumber()
  @IsNotEmpty()
  totalSalary: number;

  @IsString()
  @IsOptional()
  details?: string;
}

export class UpdatePayslipDto extends PartialType(CreatePayslipDto) {}
