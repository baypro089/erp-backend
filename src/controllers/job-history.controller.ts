import { JobHistoriesMapper } from "@/mappers/job-histories.mapper";
import { JobHistoryService } from "@/services/job-history.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { CreateJobHistoryDto, JobHistoryResponse } from "@libs/shared/types/job-histories.type";
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';

@Controller('job-histories')
export class JobHistoryController {
    // Controller methods would go here
    constructor(private jobHistoryService: JobHistoryService) { }

    @Post()
    @RequirePermissions(PERMISSIONS.JOB_HISTORY.CREATE)
    async createJobHistory(@Body() dto: CreateJobHistoryDto) : Promise<ApiResponse<JobHistoryResponse>>{
        // Implementation for creating job history would go here
        try{
            const jobHistory = await this.jobHistoryService.createJobHistory(dto);
            return ResponseHelper.send(JobHistoriesMapper.toResponse(jobHistory), 'Job history created successfully');
        } catch (error) {
            // Handle error appropriately
            console.error('Error creating job history:', error);
            throw error;
        }
    }

    @Get('employee/:id')
    @RequirePermissions(PERMISSIONS.JOB_HISTORY.VIEW)
    async getJobHistoriesByEmployeeId(@Param('id') employeeId: string) : Promise<ApiResponse<JobHistoryResponse[]>> {
        try {
            const jobHistories = await this.jobHistoryService.getJobHistoriesByEmployeeId(employeeId);
            return ResponseHelper.send(JobHistoriesMapper.toResponseList(jobHistories), 'Job histories retrieved successfully');
        } catch (error) {
            // Handle error appropriately
            console.error('Error retrieving job histories:', error);
            throw error;
        }
    }
}