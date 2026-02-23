import { CreateOrderDTO, FulfillOrderDTO } from "@/dtos/order.dto";
import { JwtAuthGuard } from "@/guards/auth.guard";
import { OrderService } from "@/services/order.service";
import { OrderMapper } from "@/mappers/order.mapper";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { OrderResponse, OrderListResponse } from "@libs/shared/types/order.type";
import { OrderStatus } from "@libs/shared/enums/order-status.enum";
import { Controller, UseGuards, Post, Body, Param, Get, Query, Req, UnauthorizedException, NotFoundException, Patch } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly service: OrderService) { }

  // API 1: Dành cho Sale tạo đơn
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateOrderDTO
  ): Promise<ApiResponse<OrderResponse>> {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }
      const result = await this.service.createOrder(userId, dto);
      return ResponseHelper.send(
        OrderMapper.toResponse(result),
        'Tạo đơn hàng thành công'
      );
    } catch (error) {
      console.error('Error in create order:', error);
      throw error;
    }
  }

  // API 2: Dành cho Kho xuất hàng
  @Post(':id/fulfill')
  async fulfill(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body() dto: FulfillOrderDTO
  ): Promise<ApiResponse<OrderResponse>> {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }
      const result = await this.service.fulfillOrder(userId, orderId, dto);
      return ResponseHelper.send(
        OrderMapper.toResponse(result),
        'Xuất hàng thành công'
      );
    } catch (error) {
      console.error('Error in fulfill order:', error);
      throw error;
    }
  }

  // API 3: Cập nhật trạng thái đơn hàng (dành cho Sale và Kho) nếu hủy đơn đã xuất hàng thì phải có warehouseId để trả hàng về kho
  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus; warehouseIdToReturn?: string }
  ): Promise<ApiResponse<OrderResponse>> {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }
      const result = await this.service.updateOrderStatus(
        userId,
        orderId,
        body.status,
        body.warehouseIdToReturn
      );
      return ResponseHelper.send(
        OrderMapper.toResponse(result),
        'Cập nhật trạng thái đơn hàng thành công'
      );
    } catch (error) {
      console.error('Error in update order status:', error);
      throw error;
    }
  }

  // API 3: Xem danh sách đơn hàng với filters và pagination
  @Get()
  async findAll(
    @Query() params: {
      code?: string;
      status?: OrderStatus;
      dateFrom?: string;
      dateTo?: string;
      totalAmountFrom?: number;
      totalAmountTo?: number;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ApiResponse<OrderListResponse>> {
    try {
      const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
      const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

      const result = await this.service.getAllOrdersWithFiltersAndPagination(
        params.code,
        params.status,
        dateFrom,
        dateTo,
        params.totalAmountFrom,
        params.totalAmountTo,
        params.page,
        params.pageSize
      );

      const page = params.page || 1;
      const pageSize = params.pageSize || 10;

      return ResponseHelper.send({
        items: OrderMapper.toTableResponseList(result.items),
        totalCount: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
        hasNextPage: page * pageSize < result.total,
        hasPreviousPage: page > 1,
      }, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
      console.error('Error in findAll orders:', error);
      throw error;
    }
  }

  // API 4: Xem chi tiết 1 đơn hàng
  @Get(':id')
  async findOne(
    @Param('id') id: string
  ): Promise<ApiResponse<OrderResponse>> {
    try {
      const result = await this.service.getOrderById(id);
      if (!result) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      return ResponseHelper.send(
        OrderMapper.toResponse(result),
        'Lấy chi tiết đơn hàng thành công'
      );
    } catch (error) {
      console.error('Error in findOne order:', error);
      throw error;
    }
  }
}