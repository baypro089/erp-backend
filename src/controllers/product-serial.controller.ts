
import { ProductSerialMapper } from "@/mappers/product-serial.mapper";
import { ProductSerialService } from "@/services/product-serial.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ProductSerialResponse } from "@libs/shared/types/product-serial.type";
import { Controller, Get, Query, Param, BadRequestException, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse as SwaggerApiResponse } from "@nestjs/swagger";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';

@ApiTags('Product Serials')
@Controller('product-serials')
export class ProductSerialController {
	constructor(private readonly productSerialService: ProductSerialService) { }

	@Get()
	@RequirePermissions(PERMISSIONS.PRODUCT_SERIAL.VIEW)
	@ApiOperation({ summary: 'Lấy danh sách serial theo sản phẩm', description: 'Danh sách serial của một sản phẩm trong kho, hỗ trợ phân trang' })
	@ApiQuery({ name: 'productId', required: true, description: 'ID sản phẩm' })
	@ApiQuery({ name: 'warehouseId', required: true, description: 'ID kho' })
	@ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
	@ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
	@SwaggerApiResponse({ status: 200, description: 'Lấy danh sách serial thành công' })
	async getSerialsByProduct(
		@Query() params: { productId?: string; warehouseId?: string; page?: number; pageSize?: number }
	): Promise<ApiResponse<{ items: ProductSerialResponse[]; totalCount: number; page: number; pageSize: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }>> {
		try {
			if (!params.productId) throw new BadRequestException('productId is required');
			if (!params.warehouseId) throw new BadRequestException('warehouseId is required');

			const result = await this.productSerialService.getSerialsByProduct(
				params.productId,
				params.warehouseId,
				params.page,
				params.pageSize,
			);

			const response = {
				items: ProductSerialMapper.toResponseList(result.data),
				totalCount: result.total,
				page: params.page || 1,
				pageSize: params.pageSize || 10,
				totalPages: Math.ceil(result.total / (params.pageSize || 10)),
				hasNextPage: (params.page || 1) * (params.pageSize || 10) < result.total,
				hasPreviousPage: (params.page || 1) > 1,
			};

			return ResponseHelper.send(response);
		} catch (error) {
			console.error('Error in getSerialsByProduct (product-serials):', error);
			throw error;
		}
	}

	@Get(':serialNumber')
	@RequirePermissions(PERMISSIONS.PRODUCT_SERIAL.VIEW)
	@ApiOperation({ summary: 'Lấy thông tin serial theo số serial', description: 'Lấy chi tiết serial theo serial number' })
	@SwaggerApiResponse({ status: 200, description: 'Lấy serial thành công' })
	async getSerialByNumber(@Param('serialNumber') serialNumber: string): Promise<ApiResponse<ProductSerialResponse>> {
		try {
			if (!serialNumber) throw new BadRequestException('serialNumber is required');

			const serial = await this.productSerialService.getSerialByNumber(serialNumber);
			if (!serial) throw new NotFoundException('Serial not found');

			return ResponseHelper.send(ProductSerialMapper.toResponse(serial));
		} catch (error) {
			console.error('Error in getSerialByNumber (product-serials):', error);
			throw error;
		}
	}
}

