import { Controller, Get, Query, Post, Body, Req, BadRequestException, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse as SwaggerApiResponse } from "@nestjs/swagger";
import { ProductStockService } from "@/services/product-stock.service";
import { ProductStockMapper } from "@/mappers/product-stock.mapper";
import { StockHistoryMapper } from "@/mappers/stock-history.mapper";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ProductStockFilteredAndPaged, ProductStockResponse } from "@libs/shared/types/product-stock.type";
import { StockHistoryFilteredAndPaged, StockHistoryResponse } from "@libs/shared/types/stock-history.type";
import { StockAdjustmentDto } from "@/dtos/stock-adjustment.dto";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';


@ApiTags('Product Stocks')
@Controller('product-stocks')
export class ProductStockController {
    constructor(private readonly productStockService: ProductStockService) { }

    @Get()
    @RequirePermissions(PERMISSIONS.PRODUCT_STOCK.VIEW)
    @ApiOperation({ summary: 'Lấy danh sách tồn kho theo kho', description: 'Lấy danh sách tồn kho của một kho, hỗ trợ tìm kiếm và phân trang' })
    @ApiQuery({ name: 'warehouseId', required: true, description: 'ID kho' })
    @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tên hoặc mã sản phẩm' })
    @ApiQuery({ name: 'lowStock', required: false, description: 'Lọc sản phẩm sắp hết hàng (true/false)' })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách tồn kho thành công' })
    async findAllFilteredAndPaged(
        @Query() params: { warehouseId?: string; search?: string; lowStock?: boolean; page?: number; pageSize?: number }
    ): Promise<ApiResponse<ProductStockFilteredAndPaged>> {
        try {
            if (!params.warehouseId) throw new BadRequestException('warehouseId is required');

            const stocks = await this.productStockService.findAllFilteredAndPaged(
                params.warehouseId,
                params.search,
                params.lowStock,
                params.page,
                params.pageSize,
            );

            const result: ProductStockFilteredAndPaged = {
                items: ProductStockMapper.toResponseList(stocks.items),
                totalCount: stocks.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(stocks.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < stocks.total,
                hasPreviousPage: (params.page || 1) > 1,
            };

            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in findAllFilteredAndPaged (product-stocks):', error);
            throw error;
        }
    }

    @Get('history/:warehouseId/:productId')
    @RequirePermissions(PERMISSIONS.PRODUCT_STOCK.VIEW)
    @ApiOperation({ summary: 'Lịch sử biến động tồn kho', description: 'Lấy lịch sử thay đổi tồn kho cho một sản phẩm trong một kho' })
    @ApiQuery({ name: 'warehouseId', required: true, description: 'ID kho' })
    @ApiQuery({ name: 'productId', required: true, description: 'ID sản phẩm' })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    async getHistoryByProductAndWarehouse(
        @Param('warehouseId') warehouseId: string,
        @Param('productId') productId: string,
        @Query() params: { page?: number; pageSize?: number }
    ): Promise<ApiResponse<StockHistoryFilteredAndPaged>> {
        try {
            if (!warehouseId || !productId) throw new BadRequestException('warehouseId and productId are required');

            const histories = await this.productStockService.findAllHistoryByProductAndWarehouse(
                warehouseId,
                productId,
                params.page,
                params.pageSize,
            );

            const result: StockHistoryFilteredAndPaged = {
                items: StockHistoryMapper.toResponseList(histories.items),
                totalCount: histories.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(histories.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < histories.total,
                hasPreviousPage: (params.page || 1) > 1,
            };

            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in getHistoryByProductAndWarehouse:', error);
            throw error;
        }
    }

    @Post('adjust')
    @RequirePermissions(PERMISSIONS.PRODUCT_STOCK.UPDATE)
    @ApiOperation({ summary: 'Điều chỉnh tồn kho thủ công', description: 'Điều chỉnh số lượng tồn kho (tăng/giảm) bằng tay' })
    @ApiBody({ type: StockAdjustmentDto })
    @SwaggerApiResponse({ status: 200, description: 'Điều chỉnh tồn kho thành công' })
    async manualAdjust(@Body() dto: StockAdjustmentDto, @Req() req: any): Promise<ApiResponse<ProductStockResponse>> {
        try {
            const userId = req.user?.id;
            const updated = await this.productStockService.manualAdjust(userId, dto);
            return ResponseHelper.send(ProductStockMapper.toResponse(updated));
        } catch (error) {
            console.error('Error in manualAdjust:', error);
            throw error;
        }
    }
}
