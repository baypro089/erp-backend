import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @IsUUID()
  @IsNotEmpty()
  currentPositionId: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
