import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateJobHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsUUID()
  @IsNotEmpty()
  positionId: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  salaryAtTime: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateJobHistoryDto {
  @IsUUID()
  @IsOptional()
  positionId?: string;
  @IsUUID()
  @IsOptional()
  departmentId?: string;
  @IsDateString()
  @IsOptional()
  startDate?: string;
  @IsDateString()
  @IsOptional()
  endDate?: string;
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryAtTime?: number;
  @IsString()
  @IsOptional()
  note?: string;
}
