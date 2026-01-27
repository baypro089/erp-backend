import { PositionService } from "@/services/position.service";
import { CreatePositionDto, UpdatePositionDto } from "@/dtos/positions.dto";
import { PositionResponse, PagedAndFilteredPosition } from "@libs/shared/types/positions.type";
import { Body, Controller, Delete, Get, Post, Put, Query, Param } from "@nestjs/common";
import { PositionsMapper } from "@/mappers/positions.mapper";
import { Position } from "@/entities/position.entity";
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';


@ApiTags('Positions')
@Controller('positions')
export class PositionController {
    constructor(
        private positionService: PositionService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách tất cả vị trí', description: 'Lấy danh sách tất cả vị trí/chức vụ đang hoạt động' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách vị trí thành công' })
    async getAllPositions(): Promise<ApiResponse<PositionResponse[]>> {
        try {
            const positions = await this.positionService.getAllPositions();
            return ResponseHelper.send(PositionsMapper.toResponseList(positions));
        } catch (error) {
            console.error('Error in getAllPositions:', error);
            throw error;
        }
    }

    @Get('/optional')
    @ApiOperation({ summary: 'Lấy danh sách vị trí với bộ lọc', description: 'Lấy danh sách vị trí với khả năng tìm kiếm, lọc theo lương và phân trang' })
    @ApiQuery({ name: 'name', required: false, description: 'Tìm kiếm theo tên vị trí' })
    @ApiQuery({ name: 'minSalary', required: false, description: 'Mức lương tối thiểu', type: Number })
    @ApiQuery({ name: 'maxSalary', required: false, description: 'Mức lương tối đa', type: Number })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách vị trí thành công' })
    async getPositionsWithOptional(
        @Query() params: {
            name?: string,
            minSalary?: number,
            maxSalary?: number,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<PagedAndFilteredPosition>> {
        try {
            const positions = await this.positionService.getAllPositionsOptional(
                params.name,
                params.minSalary,
                params.maxSalary,
                params.page,
                params.pageSize,
            );
            const result: PagedAndFilteredPosition = {
                items: PositionsMapper.toResponseList(positions.items),
                totalCount: positions.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(positions.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < positions.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in getPositionsWithOptional:', error);
            throw error;
        }
    }

    @Get('/:id')
    @ApiOperation({ summary: 'Lấy thông tin vị trí theo ID', description: 'Lấy chi tiết thông tin một vị trí' })
    @ApiParam({ name: 'id', description: 'ID của vị trí', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Lấy thông tin vị trí thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy vị trí' })
    async getPositionById(
        @Param('id') id: string
    ): Promise<ApiResponse<PositionResponse>> {
        try {
            const position = await this.positionService.getPositionById(id);
            return ResponseHelper.send(PositionsMapper.toResponse(position as Position));
        } catch (error) {
            console.error('Error in getPositionById:', error);
            throw error;
        }
    }

    @Post()
    @ApiOperation({ summary: 'Tạo vị trí mới', description: 'Tạo một vị trí/chức vụ mới' })
    @ApiBody({ type: CreatePositionDto, description: 'Thông tin vị trí cần tạo' })
    @SwaggerApiResponse({ status: 201, description: 'Tạo vị trí thành công' })
    @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async createPosition(
        @Body() createPositionDto: CreatePositionDto,
    ): Promise<ApiResponse<PositionResponse>> {
        try {
            const newPosition = await this.positionService.createPosition(
                createPositionDto,
            );

            return ResponseHelper.send(
                PositionsMapper.toResponse(newPosition),
            );
        } catch (error) {
            console.error('Error in createPosition:', error);
            throw error;
        }
    }


    @Put('/:id')
    @ApiOperation({ summary: 'Cập nhật vị trí', description: 'Cập nhật thông tin vị trí' })
    @ApiParam({ name: 'id', description: 'ID của vị trí', type: String })
    @ApiBody({ type: UpdatePositionDto, description: 'Thông tin vị trí cần cập nhật' })
    @SwaggerApiResponse({ status: 200, description: 'Cập nhật vị trí thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy vị trí' })
    async updatePosition(
        @Param('id') id: string,
        @Body() updatePositionDto: UpdatePositionDto,
    ): Promise<ApiResponse<PositionResponse>> {
        try {
            const updatedPosition = await this.positionService.updatePosition(id, updatePositionDto);
            return ResponseHelper.send(PositionsMapper.toResponse(updatedPosition as Position));
        } catch (error) {
            console.error('Error in updatePosition:', error);
            throw error;
        }
    }

    @Delete()
    async deletePosition(
        @Body() ids: string[]
    ) {
        try {
            await this.positionService.deletePositions(ids);
            return { message: 'Positions deleted successfully' };
        } catch (error) {
            console.error('Error in deletePosition:', error);
            throw error;
        }
    }
}
