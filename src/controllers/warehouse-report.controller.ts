import { WarehouseReportFilterDTO } from "@/dtos/warehouse-report-filter.dto";
import { JwtAuthGuard } from "@/guards/auth.guard";
import { WarehouseReportService } from "@/services/warehouse-report.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { IWarehouseReport } from "@libs/shared/types/warehouse-report.type";
import { Controller, UseGuards, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('warehouse-reports')
@Controller('warehouse/reports')
@UseGuards(JwtAuthGuard)
export class WarehouseReportController {
  constructor(private readonly service: WarehouseReportService) {}

  // API: Lấy báo cáo thống kê sản phẩm theo kho
  @Get('products')
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
}
