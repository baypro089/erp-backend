import { HrDashboardFilterDTO } from "@/dtos/hr-dashboard-filter.dto";
import { JwtAuthGuard } from "@/guards/auth.guard";
import { HrStatisticService } from "@/services/hr-statistic.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { IHrDashboard } from "@libs/shared/types/hr-statistics.type";
import { Controller, UseGuards, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('hr-statistics')
@Controller('hr/dashboard')
@UseGuards(JwtAuthGuard)
export class HrStatisticController {
  constructor(private readonly service: HrStatisticService) { }

  // API: Lấy dữ liệu dashboard HR
  @Get()
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
