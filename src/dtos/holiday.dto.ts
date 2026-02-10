import { IsNotEmpty, IsOptional, IsInt, IsString, IsDateString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateHolidayDto {
    @ApiProperty({ description: 'Ngày lễ (YYYY-MM-DD)', example: '2025-01-01' })
    @IsNotEmpty()
    @IsDateString()
    date: Date;

    @ApiProperty({ description: 'Tên ngày lễ', example: 'Tết Dương Lịch' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Mô tả chi tiết về ngày lễ', required: false, example: 'Năm mới dương lịch' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class SeedHolidaysDto {
    @ApiProperty({ description: 'Năm cần seed ngày lễ', example: 2025, minimum: 2000 })
    @IsNotEmpty()
    @IsInt()
    @Min(2000)
    year: number;
}

