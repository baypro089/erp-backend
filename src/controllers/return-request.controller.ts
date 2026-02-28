import { CreateReturnDTO } from "@/dtos/return-request.dto";
import { JwtAuthGuard } from "@/guards/auth.guard";
import { ReturnService } from "@/services/return-request.service";
import { ReturnRequestMapper } from "@/mappers/return-request.mapper";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ReturnRequesTableListResponse, ReturnRequestResponse } from "@libs/shared/types/return-request.type";
import { Controller, UseGuards, Post, Body, Param, Get, Query, Req, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('return-requests')
@Controller('commercial/return-requests')
@UseGuards(JwtAuthGuard)
export class ReturnRequestController {
  constructor(private readonly service: ReturnService) { }

  // API 1: Tạo phiếu trả hàng/bảo hành
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateReturnDTO
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }
      const result = await this.service.processReturn(userId, dto);
      if (!result) {
        throw new NotFoundException('Không thể tạo phiếu trả hàng');
      }
      return ResponseHelper.send(
        ReturnRequestMapper.toResponse(result),
        'Xử lý trả hàng thành công'
      );
    } catch (error) {
      console.error('Error in create return request:', error);
      throw error;
    }
  }

  // API 2: Xem danh sách phiếu trả hàng với filters và pagination
  @Get()
  async findAll(
    @Query() params: {
      code?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ApiResponse<ReturnRequesTableListResponse>> {
    try {
      const result = await this.service.getAllReturns(
        params.code,
        params.page,
        params.pageSize
      );

      const page = params.page || 1;
      const pageSize = params.pageSize || 10;

      return ResponseHelper.send({
        items: ReturnRequestMapper.toResponseTableList(result.items),
        totalCount: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
        hasNextPage: page * pageSize < result.total,
        hasPreviousPage: page > 1,
      }, 'Lấy danh sách phiếu trả hàng thành công');
    } catch (error) {
      console.error('Error in findAll return requests:', error);
      throw error;
    }
  }

  // API 3: Xem chi tiết 1 phiếu trả hàng
  @Get(':id')
  async findOne(
    @Param('id') id: string
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    try {
      const result = await this.service.getReturnRequestById(id);
      if (!result) {
        throw new NotFoundException(`Return request with ID ${id} not found`);
      }
      return ResponseHelper.send(
        ReturnRequestMapper.toResponse(result),
        'Lấy chi tiết phiếu trả hàng thành công'
      );
    } catch (error) {
      console.error('Error in findOne return request:', error);
      throw error;
    }
  }
}
