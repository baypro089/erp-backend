import { DashboardFilterDTO } from "@/dtos/dashboard-filter.dto";
import { JwtAuthGuard } from "@/guards/auth.guard";
import { AdminStatisticService } from "@/services/admin-statistic.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { IAdminDashboard } from "@libs/shared/types/statistics.type";
import { Controller, UseGuards, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('admin-statistics')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class AdminStatisticController {
  constructor(private readonly service: AdminStatisticService) { }

  // API: Lấy dữ liệu dashboard tổng quan cho Admin
  @Get()
  async getMasterDashboard(
    @Query() filter: DashboardFilterDTO
  ): Promise<ApiResponse<IAdminDashboard>> {
    try {
      const result = await this.service.getMasterDashboard(filter);
      return ResponseHelper.send(
        result,
        'Lấy dữ liệu dashboard thành công'
      );
    } catch (error) {
      console.error('Error in getMasterDashboard:', error);
      throw error;
    }
  }
}
