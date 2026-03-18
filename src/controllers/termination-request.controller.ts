import { Body, Controller, Get, Param, Post, Put, Query, Req, Logger } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse as SwaggerApiResponse, ApiTags } from "@nestjs/swagger";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { PERMISSIONS } from "@libs/shared/constants/permissions.constant";
import {
  TerminationApproveResponse,
  TerminationRequestListResponse,
  TerminationRequestResponse,
} from "@libs/shared/types/termination-request.type";
import { RequirePermissions } from "@/decorators/permissions.decorator";
import {
  CreateTerminationRequestDto,
  RejectTerminationRequestDto,
  RestoreTerminationRequestDto,
  UpdateReassignStatusDto,
} from "@/dtos/termination-request.dto";
import { TerminationRequestMapper } from "@/mappers/termination-request.mapper";
import { TerminationRequestService } from "@/services/termination-request.service";

@ApiTags("Termination Requests")
@Controller("termination-requests")
export class TerminationRequestController {
  private readonly logger = new Logger(TerminationRequestController.name);

  constructor(private readonly terminationRequestService: TerminationRequestService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.CREATE)
  @ApiOperation({ summary: "Tạo yêu cầu sa thải" })
  @ApiBody({ type: CreateTerminationRequestDto })
  @SwaggerApiResponse({ status: 201, description: "Tạo yêu cầu sa thải thành công" })
  async create(@Body() dto: CreateTerminationRequestDto): Promise<ApiResponse<TerminationRequestResponse>> {
    try {
      const result = await this.terminationRequestService.create(dto);
      return ResponseHelper.send(TerminationRequestMapper.toResponse(result), "Tạo yêu cầu sa thải thành công");
    } catch (error: any) {
      this.logger.error('create', error?.stack ?? error);
      throw error;
    }
  }

  @Get()
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.VIEW)
  @ApiOperation({ summary: "Lấy danh sách yêu cầu sa thải" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "employeeName", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query("status") status?: string,
    @Query("employeeName") employeeName?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ): Promise<ApiResponse<TerminationRequestListResponse>> {
    try {
      const result = await this.terminationRequestService.findAllFilteredAndPaged(
        req.user.id,
        status,
        employeeName,
        page,
        pageSize,
      );

      const response: TerminationRequestListResponse = {
        items: TerminationRequestMapper.toResponseList(result.items),
        totalCount: result.total,
        page: page || 1,
        pageSize: pageSize || 10,
        totalPages: Math.ceil(result.total / (pageSize || 10)),
        hasNextPage: (page || 1) * (pageSize || 10) < result.total,
        hasPreviousPage: (page || 1) > 1,
      };

      return ResponseHelper.send(response);
    } catch (error: any) {
      this.logger.error('findAll', error?.stack ?? error);
      throw error;
    }
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.VIEW)
  @ApiOperation({ summary: "Lấy chi tiết yêu cầu sa thải" })
  @ApiParam({ name: "id", description: "ID của yêu cầu sa thải" })
  async getById(@Param("id") id: string): Promise<ApiResponse<TerminationApproveResponse>> {
    try {
      const result = await this.terminationRequestService.getById(id);
      return ResponseHelper.send(TerminationRequestMapper.toApproveResponse(result.terminationRequest, result.payslip));
    } catch (error: any) {
      this.logger.error('getById', error?.stack ?? error);
      throw error;
    }
  }

  @Put(":id/approve")
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.APPROVE)
  @ApiOperation({ summary: "Duyệt yêu cầu sa thải và trả về bảng lương" })
  @ApiParam({ name: "id", description: "ID của yêu cầu sa thải" })
  async approve(@Req() req: any, @Param("id") id: string): Promise<ApiResponse<TerminationApproveResponse>> {
    try {
      const result = await this.terminationRequestService.approve(id, req.user.id);
      return ResponseHelper.send(
        TerminationRequestMapper.toApproveResponse(result.request, result.payslip),
        "Duyệt yêu cầu sa thải thành công",
      );
    } catch (error: any) {
      this.logger.error('approve', error?.stack ?? error);
      throw error;
    }
  }

  @Put(":id/reject")
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.APPROVE)
  @ApiOperation({ summary: "Từ chối yêu cầu sa thải" })
  @ApiParam({ name: "id", description: "ID của yêu cầu sa thải" })
  async reject(@Param("id") id: string): Promise<ApiResponse<TerminationRequestResponse>> {
    try {
      const result = await this.terminationRequestService.reject(id);
      return ResponseHelper.send(TerminationRequestMapper.toResponse(result), "Từ chối yêu cầu sa thải thành công");
    } catch (error: any) {
      this.logger.error('reject', error?.stack ?? error);
      throw error;
    }
  }

  @Put(":id/reassign-status")
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.UPDATE)
  @ApiOperation({ summary: "Cập nhật trạng thái bàn giao tài sản" })
  @ApiParam({ name: "id", description: "ID của yêu cầu sa thải" })
  @ApiBody({ type: UpdateReassignStatusDto })
  async updateReassignStatus(
    @Param("id") id: string,
    @Body() dto: UpdateReassignStatusDto,
  ): Promise<ApiResponse<TerminationRequestResponse>> {
    try {
      const result = await this.terminationRequestService.updateReassignStatus(id, dto.isReassigned);
      return ResponseHelper.send(TerminationRequestMapper.toResponse(result), "Cập nhật trạng thái bàn giao thành công");
    } catch (error: any) {
      this.logger.error('updateReassignStatus', error?.stack ?? error);
      throw error;
    }
  }

  @Put(":id/restore")
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.RESTORE)
  @ApiOperation({ summary: "Restore nhân viên bị sa thải (HR)" })
  @ApiParam({ name: "id", description: "ID của yêu cầu sa thải" })
  @ApiBody({ type: RestoreTerminationRequestDto })
  async restore(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: RestoreTerminationRequestDto,
  ): Promise<ApiResponse<TerminationRequestResponse>> {
    try {
      const result = await this.terminationRequestService.restore(id, req.user.id, dto);
      return ResponseHelper.send(TerminationRequestMapper.toResponse(result), "Restore nhân viên thành công");
    } catch (error: any) {
      this.logger.error('restore', error?.stack ?? error);
      throw error;
    }
  }

  @Get("employee/:employeeId")
  @RequirePermissions(PERMISSIONS.TERMINATION_REQUEST.VIEW)
  @ApiOperation({ summary: "Lấy tất cả yêu cầu sa thải theo nhân viên" })
  @ApiParam({ name: "employeeId", description: "ID nhân viên" })
  async findAllByEmployeeId(
    @Param("employeeId") employeeId: string,
  ): Promise<ApiResponse<TerminationRequestResponse[]>> {
    try {
      const result = await this.terminationRequestService.findAllByEmployeeId(employeeId);
      return ResponseHelper.send(TerminationRequestMapper.toResponseList(result));
    } catch (error: any) {
      this.logger.error('findAllByEmployeeId', error?.stack ?? error);
      throw error;
    }
  }
}
