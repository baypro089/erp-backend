import { HrDashboardFilterDTO } from "@/dtos/hr-dashboard-filter.dto";
import { HrStatisticService } from "@/services/hr-statistic.service";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { IHrDashboard } from "@libs/shared/types/hr-statistics.type";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('hr-statistics')
@Controller('hr/dashboard')
export class HrStatisticController {
  constructor(private readonly service: HrStatisticService) { }

  // API: Lấy dữ liệu dashboard HR
  @Get()
  @RequirePermissions(PERMISSIONS.HR_STATISTIC.VIEW)
  async getHrDashboard(
    @Query() filter: HrDashboardFilterDTO
  ): Promise<ApiResponse<IHrDashboard>> {
    try {
      const result = await this.service.getDashboard(filter);
      return ResponseHelper.send(
        result,
        'Lấy dữ liệu dashboard HR thành công'
      );
    } catch (error) {
      console.error('Error in getHrDashboard:', error);
      throw error;
    }
  }
}
