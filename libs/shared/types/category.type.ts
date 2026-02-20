import { PagedResult } from "./pagedResult.type";

export type CategoryResponse = {
    id: string;
    name: string;
    parent?: CategoryResponse;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateCategoryDto = {
    name: string;
    parentId?: string;
    isActive?: boolean;
}

export type UpdateCategoryDto = {
    name?: string;
    parentId?: string;
    isActive?: boolean;
}

export type PagedAndFilteredCategory = PagedResult<CategoryResponse>;