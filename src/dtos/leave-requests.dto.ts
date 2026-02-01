import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { LeaveRequestStatus, LeaveRequestType } from '@libs/shared/enums/leave-request-status.enum';

export class CreateLeaveRequestDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @IsEnum(LeaveRequestType)
  @IsNotEmpty()
  type: LeaveRequestType;

  @IsString()
  @IsNotEmpty()
  reason: string;
}