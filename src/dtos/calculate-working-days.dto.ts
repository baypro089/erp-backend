import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateWorkingDaysDTO {
    @ApiProperty({ example: '2026-03-03', description: 'Ngày bắt đầu' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ example: '2026-03-18', description: 'Ngày kết thúc' })
    @IsDateString()
    @IsNotEmpty()
    endDate: string;
}
