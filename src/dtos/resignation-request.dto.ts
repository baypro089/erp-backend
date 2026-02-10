import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateResignationDto {
    @IsNotEmpty()
    @IsUUID()
    employeeId: string;

    @IsNotEmpty()
    @IsDateString()
    desiredLastDay: Date; // Nhân viên đề xuất ngày nghỉ

    @IsNotEmpty()
    @IsString()
    reason: string;

    @IsNotEmpty()
    @IsString()
    handoverNote: string; // Bắt buộc phải có plan bàn giao
}
