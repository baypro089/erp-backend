import { WarehouseReportFilterDTO } from "@/dtos/warehouse-report-filter.dto";
import { WarehouseReportService } from "@/services/warehouse-report.service";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { IWarehouseReport } from "@libs/shared/types/warehouse-report.type";
import { Controller, Get, Query, Res } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from 'express';

@ApiTags('warehouse-reports')
@Controller('warehouse/reports')
export class WarehouseReportController {
  constructor(private readonly service: WarehouseReportService) {}

  // API: Lấy báo cáo thống kê sản phẩm theo kho
  @Get('products')
  @RequirePermissions(PERMISSIONS.WAREHOUSE_REPORT.VIEW)
  async getProductStatistics(
    @Query() filter: WarehouseReportFilterDTO
  ): Promise<ApiResponse<IWarehouseReport>> {
    try {
      const result = await this.service.getProductStatistics(filter);
      return ResponseHelper.send(
        result,
        'Lấy báo cáo thống kê sản phẩm thành công'
      );
    } catch (error) {
      console.error('Error in getProductStatistics:', error);
      throw error;
    }
  }

  @Get('export-excel')
  @RequirePermissions(PERMISSIONS.WAREHOUSE_REPORT.VIEW)
  @ApiOperation({
    summary: 'Export Warehouse Report to Excel',
    description: 'Downloads an Excel file containing product import/export/stock statistics.'
  })
  async exportExcel(
    @Query() filter: WarehouseReportFilterDTO,
    @Res() res: Response
  ): Promise<void> {
    const buffer = await this.service.exportToExcel(filter);

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `warehouse-report-${timestamp}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
