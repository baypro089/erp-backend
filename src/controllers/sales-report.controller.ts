import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalesReportService } from '@/services/sales-report.service';
import { SalesReportFilterDTO } from '@/dtos/sales-report-filter.dto';
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';
import { ICommercialReport } from '@libs/shared/types/commercial-report.type';
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { ApiResponse as ApiResponses } from "@libs/core/interfaces/apiResponse.interface";
import { Response } from 'express';

@ApiTags('Sales Reports')
@Controller('sales-reports')
export class SalesReportController {
    constructor(private readonly salesReportService: SalesReportService) { }

    @Get('profit')
    @RequirePermissions(PERMISSIONS.SALES_REPORT.VIEW)
    @ApiOperation({
        summary: 'Get Sales and Profit Report',
        description: 'Returns total revenue, COGS, profit and top exported products list.'
    })
    @ApiResponse({ status: 200, description: 'Return technical report successfully' })
    async getProfitReport(@Query() filter: SalesReportFilterDTO): Promise<ApiResponses<ICommercialReport>> {
        try {
            const result = await this.salesReportService.getSalesAndProfitReport(filter);
            return ResponseHelper.send(result, 'Lấy báo cáo doanh thu và lợi nhuận thành công');
        } catch (error) {
            console.error('Error in getProfitReport:', error);
            throw error;
        }
    }

    @Get('export-excel')
    @RequirePermissions(PERMISSIONS.SALES_REPORT.VIEW)
    @ApiOperation({
        summary: 'Export Sales Report to Excel',
        description: 'Downloads an Excel file containing revenue, profit and product export details.'
    })
    @ApiResponse({ status: 200, description: 'Excel file downloaded successfully' })
    async exportExcel(@Query() filter: SalesReportFilterDTO, @Res() res: Response): Promise<void> {
        const buffer = await this.salesReportService.exportSalesReportToExcel(filter);

        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const filename = `sales-report-${timestamp}.xlsx`;

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}
