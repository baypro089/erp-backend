import { CreateCategoryDTO, UpdateCategoryDTO } from "@/dtos/category.dto";
import { CategoryMapper } from "@/mappers/category.mapper";
import { CategoryService } from "@/services/category.service";
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { CategoryResponse, PagedAndFilteredCategory } from "@libs/shared/types/category.type";
import { Controller, Get, Param, Query, Body, Post, Put, Delete, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("categories")
@Controller("categories")
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService
    ) { }

    @Get()
    @RequirePermissions(PERMISSIONS.CATEGORY.VIEW)
    async findAllCategoriesFilteredAndPaged(
        @Query() params: {
            name?: string,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<PagedAndFilteredCategory>> {
        const categories = await this.categoryService.findAllFilteredAndPaged(
            params.name,
            params.page,
            params.pageSize,
        );
        const result: PagedAndFilteredCategory = {
            items: CategoryMapper.toResponseList(categories.items),
            totalCount: categories.total,
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            totalPages: Math.ceil(categories.total / (params.pageSize || 10)),
            hasNextPage: (params.page || 1) * (params.pageSize || 10) < categories.total,
            hasPreviousPage: (params.page || 1) > 1,
        };
        return ResponseHelper.send(result, 'Get categories successfully.');
    }
    @Get(":id")
    @RequirePermissions(PERMISSIONS.CATEGORY.VIEW)
    async findCategoryById(
        @Param("id") id: string,
    ): Promise<ApiResponse<CategoryResponse>> {
        const category = await this.categoryService.findById(id);
        if (!category) {
            throw new NotFoundException("Category not found");
        }
        return ResponseHelper.send(CategoryMapper.toResponse(category), 'Get category successfully.');
    }

    @Post()
    @RequirePermissions(PERMISSIONS.CATEGORY.CREATE)
    async createCategory(
        @Body() categoryData: CreateCategoryDTO,
    ): Promise<ApiResponse<CategoryResponse>> {
        const created = await this.categoryService.createCategory(categoryData as any);
        return ResponseHelper.send(CategoryMapper.toResponse(created), 'Create category successfully.');
    }

    @Put(":id")
    @RequirePermissions(PERMISSIONS.CATEGORY.UPDATE)
    async updateCategory(
        @Param("id") id: string,
        @Body() updateData: UpdateCategoryDTO,
    ): Promise<ApiResponse<CategoryResponse>> {
        const updated = await this.categoryService.updateCategory(id, updateData as any);
        return ResponseHelper.send(CategoryMapper.toResponse(updated), 'Update category successfully.');
    }

    @Delete()
    @RequirePermissions(PERMISSIONS.CATEGORY.DELETE)
    async removeCategories(
        @Body("ids") ids: string[],
    ) {
        await this.categoryService.deleteCategory(ids);
        return ResponseHelper.send(null, 'Delete category successfully.');
    }

}