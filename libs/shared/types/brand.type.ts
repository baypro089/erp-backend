import { PagedResult } from './pagedResult.type';

export type BrandResponse = {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateBrandDto = {
    name: string;
}

export type UpdateBrandDto = {
    name?: string;
    isActive?: boolean;
}

export type PagedAndFilteredBrand = PagedResult<BrandResponse>;