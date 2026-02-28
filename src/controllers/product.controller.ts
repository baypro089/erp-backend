import { ProductMapper } from "@/mappers/product.mapper";
import { AttachmentMapper } from "@/mappers/attachment.mapper";
import { ProductService } from "@/services/product.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { PagedAndFilteredProduct, ProductResponse } from "@libs/shared/types/product.type";
import { AttachmentResponse } from "@libs/shared/types/attachment.type";
import { 
    Controller, 
    Get, 
    Param, 
    Query, 
    Body, 
    Post, 
    Put, 
    Delete, 
    NotFoundException,
    UseInterceptors,
    UploadedFile 
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes, ApiBody } from "@nestjs/swagger";

@ApiTags("products")
@Controller("products")
export class ProductController {
    constructor(
        private readonly productService: ProductService,
    ) { }

    @Get()
    async findAllProductsFilteredAndPaged(
        @Query() params: {
            sku?: string;
            name?: string;
            brandId?: string;
            categoryId?: string;
            retailPriceMin?: number;
            retailPriceMax?: number;
            page?: number;
            pageSize?: number;
        },
    ): Promise<ApiResponse<PagedAndFilteredProduct>> {
        try {
            const products = await this.productService.findAllFilteredAndPaged(
                params.sku,
                params.name,
                params.brandId,
                params.categoryId,
                params.retailPriceMin,
                params.retailPriceMax,
                params.page,
                params.pageSize,
            );
            const result: PagedAndFilteredProduct = {
                items: ProductMapper.toResponseTableList(products.items),
                totalCount: products.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(products.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < products.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result, 'Get products successfully.');
        } catch (error) {
            console.error('Error in findAllProductsFilteredAndPaged:', error);
            throw error;
        }
    }

    @Get(":id")
    async findProductById(@Param("id") id: string): Promise<ApiResponse<ProductResponse>> {
        try {
            const product = await this.productService.findById(id);
            if (!product) {
                throw new NotFoundException("Product not found");
            }
            return ResponseHelper.send(ProductMapper.toResponse(product), 'Get product successfully.');
        } catch (error) {
            console.error('Error in findProductById:', error);
            throw error;
        }
    }

    @Post()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                sku: { type: 'string' },
                name: { type: 'string' },
                categoryId: { type: 'string' },
                brandId: { type: 'string' },
                retailPrice: { type: 'number' },
                warrantyMonths: { type: 'string' },
                hasSerialNumber: { type: 'boolean' },
                specifications: { type: 'object' },
                thumbnail: {
                    type: 'string',
                    format: 'binary',
                    description: 'Ảnh thumbnail sản phẩm',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('thumbnail'))
    async createProduct(
        @Body() productData: Partial<any>,
        @UploadedFile() thumbnail?: Express.Multer.File,
    ): Promise<ApiResponse<ProductResponse>> {
        try {
            const created = await this.productService.createProduct(productData, thumbnail);
            return ResponseHelper.send(ProductMapper.toResponse(created), 'Create product successfully.');
        } catch (error) {
            console.error('Error in createProduct:', error);
            throw error;
        }
    }

    @Put(":id")
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                sku: { type: 'string' },
                name: { type: 'string' },
                categoryId: { type: 'string' },
                brandId: { type: 'string' },
                retailPrice: { type: 'number' },
                warrantyMonths: { type: 'string' },
                hasSerialNumber: { type: 'boolean' },
                specifications: { type: 'object' },
                thumbnail: {
                    type: 'string',
                    format: 'binary',
                    description: 'Ảnh thumbnail sản phẩm mới (nếu muốn thay đổi)',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('thumbnail'))
    async updateProduct(
        @Param("id") id: string,
        @Body() updateData: Partial<any>,
        @UploadedFile() thumbnail?: Express.Multer.File,
    ): Promise<ApiResponse<ProductResponse>> {
        try {
            const updated = await this.productService.updateProduct(id, updateData, thumbnail);
            return ResponseHelper.send(ProductMapper.toResponse(updated), 'Update product successfully.');
        } catch (error) {
            console.error('Error in updateProduct:', error);
            throw error;
        }
    }

    @Delete()
    async removeProducts(@Body("ids") ids: string[]) {
        try {
            await this.productService.deleteProduct(ids);
            return ResponseHelper.send(null, 'Delete product successfully.');
        } catch (error) {
            console.error('Error in removeProducts:', error);
            throw error;
        }
    }

    /**
     * Lấy ảnh thumbnail của product
     */
    @Get(':id/thumbnail')
    async getProductThumbnail(@Param('id') id: string): Promise<ApiResponse<AttachmentResponse | null>> {
        try {
            const thumbnail = await this.productService.getProductThumbnail(id);
            const response = thumbnail ? AttachmentMapper.toResponse(thumbnail) : null;
            return ResponseHelper.send(response, 'Get product thumbnail successfully.');
        } catch (error) {
            console.error('Error in getProductThumbnail:', error);
            throw error;
        }
    }
}
