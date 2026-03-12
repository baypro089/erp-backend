import { ManagerReportFilterDTO } from "@/dtos/manager-report-filter.dto";
import { PayslipsMapper } from "@/mappers/payslips.mapper";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';
import { HrReportService } from "@/services/hr-report.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { IManagerReport } from "@libs/shared/types/manager-report.type";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('hr-reports')
@Controller('hr/reports')
export class HrReportController {
    constructor(private readonly service: HrReportService) { }

    // API: Lấy báo cáo quản lý (Manager Report)
    @Get('manager')
    @RequirePermissions(PERMISSIONS.HR_REPORT.VIEW)
    async getManagerReport(
        @Query() filter: ManagerReportFilterDTO
    ): Promise<ApiResponse<IManagerReport>> {
        try {
            const result = await this.service.getManagerReport(filter);
            return ResponseHelper.send({
                period: result.period,
                headcount: result.headcount,
                payrollSummary: result.payrollSummary,
                payrollDetails: PayslipsMapper.toResponseList(result.payrollDetails),
            }, 'Lấy báo cáo quản lý thành công');
        } catch (error) {
            console.error('Error in getManagerReport:', error);
            throw error;
        }
    }
}
