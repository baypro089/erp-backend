import { SystemSettingMapper } from "@/mappers/system-setting.mapper";
import { SystemSettingService } from "@/services/system-setting.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { SalaryComponentResponse } from "@libs/shared/types/salary-component.type";
import { SystemSettingResponse, SystemSettingUpdateDto } from "@libs/shared/types/system-setting.type";
import { Controller, Get, Patch } from "@nestjs/common";

@Controller('system-settings')
export class SystemSettingController {
    // Controller methods would go here
    constructor(
        private readonly systemSettingService: SystemSettingService,
    ) { }

    @Get()
    async findAll() : Promise<ApiResponse<SystemSettingResponse[]>> {
        const settings = await this.systemSettingService.findAll();
        return ResponseHelper.send(SystemSettingMapper.toDtoList(settings), 'Lấy danh sách cài đặt hệ thống thành công');
    }

    @Patch(':key')
    async update(key: string, dto: SystemSettingUpdateDto) : Promise<ApiResponse<SystemSettingResponse>> {
        const result = await this.systemSettingService.update(key, dto);
        return ResponseHelper.send(SystemSettingMapper.toDto(result), 'Cập nhật cài đặt hệ thống thành công');
    }

    @Get('salary-components')
    async getSalaryComponents() : Promise<ApiResponse<SalaryComponentResponse[]>> {
        const components = await this.systemSettingService.getSalaryComponents();
        return ResponseHelper.send(SystemSettingMapper.salaryComponentToDtoList(components), 'Lấy danh sách thành phần lương thành công');
    }
}