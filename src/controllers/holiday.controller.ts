import { HolidayService } from "@/services/holiday.service";
import { 
    Controller, 
    Get, 
    Post, 
    Delete, 
    Body, 
    Param, 
    Query,
    ParseIntPipe 
} from "@nestjs/common";
import { CreateHolidayDto, SeedHolidaysDto } from "@/dtos/holiday.dto";
import { HolidayMapper } from "@/mappers/holidays.mapper";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { HolidayResponse } from "@libs/shared/types/holiday.type";
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody } from "@nestjs/swagger";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';

@ApiTags('Holidays')
@Controller('holidays')
export class HolidayController {
    constructor(private readonly holidayService: HolidayService) {}

    @Post('seed')
    @RequirePermissions(PERMISSIONS.HOLIDAY.CREATE)
    @ApiOperation({ 
        summary: 'Tự động seed ngày lễ cho năm', 
        description: 'Tự động tạo danh sách ngày lễ Việt Nam cho một năm cụ thể từ thư viện date-holidays' 
    })
    @ApiBody({ type: SeedHolidaysDto })
    @SwaggerApiResponse({ 
        status: 201, 
        description: 'Seed ngày lễ thành công' 
    })
    async seedHolidays(
        @Body() dto: SeedHolidaysDto
    ): Promise<ApiResponse<{ message: string }>> {
        try {
            await this.holidayService.seedHolidays(dto.year);
            return ResponseHelper.send({ 
                message: `Đã seed thành công ngày lễ cho năm ${dto.year}` 
            });
        } catch (error) {
            console.error('Error in seedHolidays:', error);
            throw error;
        }
    }

    @Get()
    @RequirePermissions(PERMISSIONS.HOLIDAY.VIEW)
    @ApiOperation({ 
        summary: 'Lấy danh sách ngày lễ theo năm', 
        description: 'Lấy tất cả ngày lễ trong một năm cụ thể' 
    })
    @ApiQuery({ name: 'year', required: true, description: 'Năm cần lấy danh sách ngày lễ', type: Number })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Lấy danh sách ngày lễ thành công' 
    })
    async getHolidays(
        @Query('year', ParseIntPipe) year: number
    ): Promise<ApiResponse<HolidayResponse[]>> {
        try {
            const holidays = await this.holidayService.getHolidays(year);
            return ResponseHelper.send(HolidayMapper.toResponseList(holidays));
        } catch (error) {
            console.error('Error in getHolidays:', error);
            throw error;
        }
    }

    @Post()
    @RequirePermissions(PERMISSIONS.HOLIDAY.CREATE)
    @ApiOperation({ 
        summary: 'Tạo ngày lễ mới', 
        description: 'Thêm một ngày lễ tùy chỉnh vào hệ thống' 
    })
    @ApiBody({ type: CreateHolidayDto })
    @SwaggerApiResponse({ 
        status: 201, 
        description: 'Tạo ngày lễ thành công' 
    })
    @SwaggerApiResponse({ 
        status: 400, 
        description: 'Dữ liệu không hợp lệ' 
    })
    async createHoliday(
        @Body() dto: CreateHolidayDto
    ): Promise<ApiResponse<HolidayResponse>> {
        try {
            const holiday = await this.holidayService.createHoliday(dto);
            return ResponseHelper.send(HolidayMapper.toResponse(holiday));
        } catch (error) {
            console.error('Error in createHoliday:', error);
            throw error;
        }
    }

    @Delete(':id')
    @RequirePermissions(PERMISSIONS.HOLIDAY.DELETE)
    @ApiOperation({ 
        summary: 'Xóa ngày lễ', 
        description: 'Xóa một ngày lễ khỏi hệ thống theo ID' 
    })
    @ApiParam({ name: 'id', description: 'ID của ngày lễ cần xóa' })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Xóa ngày lễ thành công' 
    })
    @SwaggerApiResponse({ 
        status: 404, 
        description: 'Không tìm thấy ngày lễ' 
    })
    async deleteHoliday(
        @Param('id', ParseIntPipe) id: number
    ): Promise<ApiResponse<{ message: string }>> {
        try {
            await this.holidayService.deleteHoliday(id);
            return ResponseHelper.send({ message: 'Xóa ngày lễ thành công' });
        } catch (error) {
            console.error('Error in deleteHoliday:', error);
            throw error;
        }
    }
}