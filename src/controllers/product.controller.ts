import { ProductMapper } from "@/mappers/product.mapper";
import { ProductService } from "@/services/product.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { PagedAndFilteredProduct, ProductResponse } from "@libs/shared/types/product.type";
import { Controller, Get, Param, Query, Body, Post, Put, Delete, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

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
    async createProduct(@Body() productData: Partial<any>): Promise<ApiResponse<ProductResponse>> {
        try {
            const created = await this.productService.createProduct(productData as any);
            return ResponseHelper.send(ProductMapper.toResponse(created), 'Create product successfully.');
        } catch (error) {
            console.error('Error in createProduct:', error);
            throw error;
        }
    }

    @Put(":id")
    async updateProduct(@Param("id") id: string, @Body() updateData: Partial<any>): Promise<ApiResponse<ProductResponse>> {
        try {
            const updated = await this.productService.updateProduct(id, updateData as any);
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
}
