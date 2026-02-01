import { LeaveRequestService } from "@/services/leave-request.service";
import { 
    Controller, 
    Post, 
    Get, 
    Patch, 
    Body, 
    Param, 
    Query, 
    Req, 
    UseGuards,
    BadRequestException 
} from "@nestjs/common";
import { CreateLeaveRequestDto } from "@/dtos/leave-requests.dto";
import { LeaveRequestsMapper } from "@/mappers/leave-requests.mapper";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { LeaveRequestResponse, PagedAndFilteredLeaveRequest } from "@libs/shared/types/leave-requests.type";
import { JwtAuthGuard } from "@/guards/auth.guard";
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody, ApiCookieAuth } from "@nestjs/swagger";
import { LeaveRequestStatus } from "@libs/shared/enums/leave-request-status.enum";

@ApiTags('Leave Requests')
@Controller('hr/leave-requests')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth()
export class LeaveRequestController {
    constructor(private readonly leaveRequestService: LeaveRequestService) {}

    @Post()
    @ApiOperation({ 
        summary: 'Tạo đơn nghỉ phép mới', 
        description: 'Tạo đơn xin nghỉ phép cho nhân viên. Hệ thống sẽ kiểm tra trùng lịch nghỉ và validate thời gian.' 
    })
    @ApiBody({ type: CreateLeaveRequestDto })
    @SwaggerApiResponse({ 
        status: 201, 
        description: 'Tạo đơn nghỉ phép thành công' 
    })
    @SwaggerApiResponse({ 
        status: 400, 
        description: 'Dữ liệu không hợp lệ hoặc trùng lịch nghỉ' 
    })
    async createLeaveRequest(
        @Body() dto: CreateLeaveRequestDto,
        @Req() req: any
    ): Promise<ApiResponse<LeaveRequestResponse>> {
        try {
            const userId = req.user.id;
            const leaveRequest = await this.leaveRequestService.create(userId, dto);
            return ResponseHelper.send(LeaveRequestsMapper.toResponse(leaveRequest));
        } catch (error) {
            console.error('Error in createLeaveRequest:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ 
        summary: 'Lấy danh sách đơn nghỉ phép với bộ lọc', 
        description: 'Lấy danh sách đơn nghỉ phép với khả năng tìm kiếm, lọc theo trạng thái, thời gian và phân trang' 
    })
    @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái (PENDING, APPROVED, REJECTED)' })
    @ApiQuery({ name: 'startDateFrom', required: false, description: 'Ngày bắt đầu từ', type: Date })
    @ApiQuery({ name: 'startDateTo', required: false, description: 'Ngày bắt đầu đến', type: Date })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Lấy danh sách đơn nghỉ phép thành công' 
    })
    async getLeaveRequests(
        @Query() params: {
            status?: string,
            startDateFrom?: Date,
            startDateTo?: Date,
            page?: number,
            pageSize?: number,
        },
        @Req() req: any
    ): Promise<ApiResponse<PagedAndFilteredLeaveRequest>> {
        try {
            const userId = req.user.id;
            const roleCode = req.user.role?.code;
            
            const leaveRequests = await this.leaveRequestService.findAllWithFilteredAndPaged(
                userId,
                roleCode,
                params.status,
                params.startDateFrom,
                params.startDateTo,
                params.page,
                params.pageSize,
            );

            const result: PagedAndFilteredLeaveRequest = {
                items: LeaveRequestsMapper.toResponseList(leaveRequests.items),
                totalCount: leaveRequests.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(leaveRequests.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < leaveRequests.total,
                hasPreviousPage: (params.page || 1) > 1,
            };

            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in getLeaveRequests:', error);
            throw error;
        }
    }

    @Patch(':id/status')
    @ApiOperation({ 
        summary: 'Cập nhật trạng thái đơn nghỉ phép', 
        description: 'Phê duyệt hoặc từ chối đơn nghỉ phép. Chỉ có thể cập nhật đơn đang ở trạng thái PENDING.' 
    })
    @ApiParam({ name: 'id', description: 'ID của đơn nghỉ phép' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['APPROVED', 'REJECTED'],
                    description: 'Trạng thái mới (APPROVED hoặc REJECTED)'
                },
                reason: {
                    type: 'string',
                    description: 'Lý do từ chối (bắt buộc khi REJECTED)',
                }
            },
            required: ['status']
        }
    })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Cập nhật trạng thái thành công' 
    })
    @SwaggerApiResponse({ 
        status: 400, 
        description: 'Không thể cập nhật trạng thái' 
    })
    @SwaggerApiResponse({ 
        status: 404, 
        description: 'Không tìm thấy đơn nghỉ phép' 
    })
    async updateLeaveRequestStatus(
        @Param('id') id: string,
        @Body() body: { status: LeaveRequestStatus, reason?: string },
        @Req() req: any
    ): Promise<ApiResponse<LeaveRequestResponse>> {
        try {
            const approverId = req.user.id;
            
            if (!body.status) {
                throw new BadRequestException('Status is required');
            }

            if (body.status === LeaveRequestStatus.REJECTED && !body.reason) {
                throw new BadRequestException('Reason is required when rejecting a leave request');
            }

            const leaveRequest = await this.leaveRequestService.updateStatus(
                id,
                body.status,
                approverId,
                body.reason
            );

            return ResponseHelper.send(LeaveRequestsMapper.toResponse(leaveRequest));
        } catch (error) {
            console.error('Error in updateLeaveRequestStatus:', error);
            throw error;
        }
    }
}