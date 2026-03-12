import { IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportPeriod } from '@libs/shared/enums/report-period.enum';

export class SalesReportFilterDTO {
    @IsOptional()
    @IsEnum(ReportPeriod)
    periodType?: ReportPeriod = ReportPeriod.MONTH; // Mặc định xem theo tháng

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(12)
    month?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(4)
    quarter?: number; // Quý 1, 2, 3, 4

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(2020)
    year?: number;
}