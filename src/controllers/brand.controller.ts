import { CreateBrandDTO, UpdateBrandDTO } from "@/dtos/brand.dto";
import { BrandMapper } from "@/mappers/brand.mapper";
import { BrandService } from "@/services/brand.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { BrandResponse, PagedAndFilteredBrand } from "@libs/shared/types/brand.type";
import { Controller, Get, Param, Query, Body, Post, Put, Delete, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("brands")
@Controller("brands")
export class BrandController {
    constructor(
        private readonly brandService: BrandService,
    ) { }

    @Get()
    async findAllBrandsFilteredAndPaged(
        @Query() params: { name?: string; page?: number; pageSize?: number },
    ): Promise<ApiResponse<PagedAndFilteredBrand>> {
        const brands = await this.brandService.findAllFilteredAndPaged(
            params.name,
            params.page,
            params.pageSize,
        );
        const result: PagedAndFilteredBrand = {
            items: BrandMapper.toResponseList(brands.items),
            totalCount: brands.total,
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            totalPages: Math.ceil(brands.total / (params.pageSize || 10)),
            hasNextPage: (params.page || 1) * (params.pageSize || 10) < brands.total,
            hasPreviousPage: (params.page || 1) > 1,
        };
        return ResponseHelper.send(result, 'Get brands successfully.');
    }

    @Get(":id")
    async findBrandById(@Param("id") id: string): Promise<ApiResponse<BrandResponse>> {
        const brand = await this.brandService.findById(id);
        if (!brand) {
            throw new NotFoundException("Brand not found");
        }
        return ResponseHelper.send(BrandMapper.toResponse(brand), 'Get brand successfully.');
    }

    @Post()
    async createBrand(@Body() brandData: CreateBrandDTO): Promise<ApiResponse<BrandResponse>> {
        const created = await this.brandService.createBrand(brandData as any);
        return ResponseHelper.send(BrandMapper.toResponse(created), 'Create brand successfully.');
    }

    @Put(":id")
    async updateBrand(@Param("id") id: string, @Body() updateData: Partial<UpdateBrandDTO>): Promise<ApiResponse<BrandResponse>> {
        const updated = await this.brandService.updateBrand(id, updateData);
        return ResponseHelper.send(BrandMapper.toResponse(updated), 'Update brand successfully.');
    }

    @Delete()
    async removeBrands(@Body("ids") ids: string[]) {
        await this.brandService.deleteBrand(ids);
        return ResponseHelper.send(null, 'Delete brand successfully.');
    }
}
