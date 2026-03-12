import { ResignationRequestService } from "@/services/resignation-request.service";
import { Body, Controller, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateResignationDto } from "@/dtos/resignation-request.dto";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ResignationRequest } from "@/entities/resignation-request.entity";
import { ResignationRequestListResponse, ResignationRequestResponse } from "@libs/shared/types/resignation-request.type";
import { ResignationRequestMapper } from "@/mappers/resignation-request.mapper";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';

@ApiTags('Resignation Requests')
@Controller('resignation-requests')
export class ResignationRequestController {
    constructor(
        private readonly resignationRequestService: ResignationRequestService,
    ) { }

    @Post()
    @RequirePermissions(PERMISSIONS.RESIGNATION_REQUEST.CREATE)
    @ApiOperation({ summary: 'Tạo đơn nghỉ việc', description: 'Nhân viên nộp đơn xin nghỉ việc' })
    @ApiBody({ type: CreateResignationDto })
    @SwaggerApiResponse({ status: 201, description: 'Tạo đơn nghỉ việc thành công' })
    @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc đã có đơn đang chờ' })
    async create(@Body() dto: CreateResignationDto): Promise<ApiResponse<ResignationRequestResponse>> {
        try {
            const result = await this.resignationRequestService.create(dto);
            return ResponseHelper.send(ResignationRequestMapper.toResponse(result), 'Tạo đơn nghỉ việc thành công');
        } catch (error) {
            console.error('Error in create resignation request:', error);
            throw error;
        }
    }

    @Get()
    @RequirePermissions(PERMISSIONS.RESIGNATION_REQUEST.VIEW)
    @ApiOperation({ summary: 'Lấy danh sách đơn nghỉ việc', description: 'Lấy danh sách đơn nghỉ việc với bộ lọc và phân trang' })
    @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái (PENDING, APPROVED, REJECTED, COMPLETED)' })
    @ApiQuery({ name: 'employeeName', required: false, description: 'Tìm kiếm theo tên nhân viên' })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
    async findAll(
        @Req() req: any, 
        @Query('status') status?: string,
        @Query('employeeName') employeeName?: string,
        @Query('page') page?: number,
        @Query('pageSize') pageSize?: number,
    ): Promise<ApiResponse<ResignationRequestListResponse>> {
        try {
            const resignations = await this.resignationRequestService.findAllFilteredAndPaged(
                req.user.id,
                status,
                employeeName,
                page,
                pageSize,
            );
            const result: ResignationRequestListResponse = {
                items: ResignationRequestMapper.toResponseList(resignations.items),
                totalCount: resignations.total,
                page: page || 1,
                pageSize: pageSize || 10,
                totalPages: Math.ceil(resignations.total / (pageSize || 10)),
                hasNextPage: (page || 1) * (pageSize || 10) < resignations.total,
                hasPreviousPage: (page || 1) > 1,
            };
            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in findAll resignation requests:', error);
            throw error;
        }
    }

    @Get(':id')
    @RequirePermissions(PERMISSIONS.RESIGNATION_REQUEST.VIEW)
    @ApiOperation({ summary: 'Lấy chi tiết đơn nghỉ việc', description: 'Lấy thông tin chi tiết của một đơn nghỉ việc' })
    @ApiParam({ name: 'id', description: 'ID của đơn nghỉ việc' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy đơn nghỉ việc' })
    async getById(@Param('id') id: string): Promise<ApiResponse<ResignationRequestResponse>> {
        try {
            const result = await this.resignationRequestService.getById(id);
            return ResponseHelper.send(ResignationRequestMapper.toResponse(result!));
        } catch (error) {
            console.error('Error in getById resignation request:', error);
            throw error;
        }
    }

    @Put(':id/approve')
    @RequirePermissions(PERMISSIONS.RESIGNATION_REQUEST.APPROVE)
    @ApiOperation({ summary: 'Duyệt đơn nghỉ việc', description: 'HR phê duyệt đơn nghỉ việc và xác định ngày nghỉ chính thức' })
    @ApiParam({ name: 'id', description: 'ID của đơn nghỉ việc' })
    @SwaggerApiResponse({ status: 200, description: 'Duyệt đơn thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy đơn nghỉ việc' })
    async approve(
        @Param('id') id: string,
        @Body() dto: { id: string, approvedLastDay: Date, hrNote?: string },
    ): Promise<ApiResponse<ResignationRequestResponse>> {
        try {
            const result = await this.resignationRequestService.approve(
                id,
                dto.approvedLastDay,
                dto.hrNote,
            );
            return ResponseHelper.send(ResignationRequestMapper.toResponse(result), 'Duyệt đơn nghỉ việc thành công');
        } catch (error) {
            console.error('Error in approve resignation request:', error);
            throw error;
        }
    }

    @Put(':id/reject')
    @RequirePermissions(PERMISSIONS.RESIGNATION_REQUEST.APPROVE)
    @ApiOperation({ summary: 'Từ chối đơn nghỉ việc', description: 'HR từ chối đơn nghỉ việc với lý do cụ thể' })
    @ApiParam({ name: 'id', description: 'ID của đơn nghỉ việc' })
    @SwaggerApiResponse({ status: 200, description: 'Từ chối đơn thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy đơn nghỉ việc' })
    async reject(
        @Param('id') id: string,
        @Body() dto: { hrNote: string },
    ): Promise<ApiResponse<ResignationRequestResponse>> {
        try {
            const result = await this.resignationRequestService.reject(
                id,
                dto.hrNote,
            );
            return ResponseHelper.send(ResignationRequestMapper.toResponse(result), 'Từ chối đơn nghỉ việc thành công');
        } catch (error) {
            console.error('Error in reject resignation request:', error);
            throw error;
        }
    }

    @Get('employee/:employeeId')
    @RequirePermissions(PERMISSIONS.RESIGNATION_REQUEST.VIEW)
    @ApiOperation({ summary: 'Lấy tất cả đơn nghỉ việc của nhân viên', description: 'Lấy danh sách tất cả đơn nghỉ việc của một nhân viên cụ thể' })
    @ApiParam({ name: 'employeeId', description: 'ID của nhân viên' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
    async findAllByEmployeeId(
        @Param('employeeId') employeeId: string,
    ): Promise<ApiResponse<ResignationRequestResponse[]>> {
        try {
            const results = await this.resignationRequestService.findAllByEmployeeId(employeeId);
            return ResponseHelper.send(ResignationRequestMapper.toResponseList(results));
        } catch (error) {
            console.error('Error in findAllByEmployeeId resignation requests:', error);
            throw error;
        }
    }

    @Get('process/due')
    @RequirePermissions(PERMISSIONS.RESIGNATION_REQUEST.APPROVE)
    @ApiOperation({ summary: 'Xử lý đơn nghỉ việc đến hạn', description: 'Cron Job: Chạy mỗi đêm để quét các đơn đã đến hạn và tự động chuyển trạng thái' })
    @SwaggerApiResponse({ status: 200, description: 'Xử lý đơn nghỉ việc đến hạn thành công' })
    async processDueResignations(): Promise<ApiResponse<void>> {
        try {
            await this.resignationRequestService.processDueResignations();
            return ResponseHelper.send(undefined, 'Xử lý đơn nghỉ việc đến hạn thành công');
        } catch (error) {
            console.error('Error in processDueResignations:', error);
            throw error;
        }
    }
}