import { SalesDashboardFilterDTO } from "@/dtos/sales-dashboard-filter.dto";
import { SalesStatisticService } from "@/services/sales-statistic.service";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ISalesDashboard } from "@libs/shared/types/sales-statistics.type";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('sales-statistics')
@Controller('sales/dashboard')
export class SalesStatisticController {
  constructor(private readonly service: SalesStatisticService) { }

  // API: Lấy dữ liệu dashboard Sales
  @Get()
  @RequirePermissions(PERMISSIONS.SALES_STATISTIC.VIEW)
  async getSalesDashboard(
    @Query() filter: SalesDashboardFilterDTO
  ): Promise<ApiResponse<ISalesDashboard>> {
    try {
      const result = await this.service.getDashboard(filter);
      return ResponseHelper.send(
        result,
        'Lấy dữ liệu dashboard Sales thành công'
      );
    } catch (error) {
      console.error('Error in getSalesDashboard:', error);
      throw error;
    }
  }
}
