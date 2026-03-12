import { SystemSettingMapper } from "@/mappers/system-setting.mapper";
import { SystemSettingService } from "@/services/system-setting.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { SalaryComponentResponse } from "@libs/shared/types/salary-component.type";
import { SystemSettingResponse, SystemSettingUpdateDto } from "@libs/shared/types/system-setting.type";
import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';

@Controller('system-settings')
export class SystemSettingController {
    // Controller methods would go here
    constructor(
        private readonly systemSettingService: SystemSettingService,
    ) { }

    @Get()
    @RequirePermissions(PERMISSIONS.SYSTEM_SETTING.VIEW)
    async findAll(): Promise<ApiResponse<SystemSettingResponse[]>> {
        try {
            const settings = await this.systemSettingService.findAll();
            return ResponseHelper.send(SystemSettingMapper.toDtoList(settings), 'Lấy danh sách cài đặt hệ thống thành công');
        } catch (error) {
            console.error('Lấy danh sách cài đặt hệ thống thất bại', error);
            throw error;
        }
        
    }

    @Patch(':key')
    @RequirePermissions(PERMISSIONS.SYSTEM_SETTING.UPDATE)
    async update(@Param('key') key: string, @Body() dto: SystemSettingUpdateDto): Promise<ApiResponse<SystemSettingResponse>> {
        try {
            const result = await this.systemSettingService.update(key, dto);
            return ResponseHelper.send(SystemSettingMapper.toDto(result), 'Cập nhật cài đặt hệ thống thành công');
        } catch (error) {
            console.error('Cập nhật cài đặt hệ thống thất bại', error);
            throw error;
        }
    }

    @Get('salary-components')
    @RequirePermissions(PERMISSIONS.SYSTEM_SETTING.VIEW)
    async getSalaryComponents(): Promise<ApiResponse<SalaryComponentResponse[]>> {
        try {
            const components = await this.systemSettingService.getSalaryComponents();
            return ResponseHelper.send(SystemSettingMapper.salaryComponentToDtoList(components), 'Lấy danh sách thành phần lương thành công');
        } catch (error) {
            console.error('Lấy danh sách thành phần lương thất bại', error);
            throw error;
        }
    }
}