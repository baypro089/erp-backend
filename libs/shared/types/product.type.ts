import { BrandResponse } from "./brand.type";
import { CategoryResponse } from "./category.type";
import { PagedResult } from "./pagedResult.type";

export type ProductResponse = {
    id: string;
    sku?: string; // Mã SKU quản lý nội bộ (VD: CPU-INTEL-I9-14900K)
    name: string; // Tên hiển thị (VD: CPU Intel Core i9 14900K)
    category: CategoryResponse; // Danh mục sản phẩm
    brand: BrandResponse; // Thương hiệu sản phẩm
    retailPrice: number; // Giá niêm yết (Giá bán mặc định)
    stockQuantity: number;
    warrantyMonths: string; // Thời gian bảo hành (VD: 12 tháng, 6 tháng)
    hasSerialNumber: boolean; // Có quản lý theo Serial Number không?
    specifications: Record<string, any>; // Thông số kỹ thuật động
    thumbnailUrl?: string; // Ảnh đại diện
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type ProductTableResponse = {
    id: string;
    sku?: string;
    name: string;
    categoryName: string;
    brandName: string;
    retailPrice: number;
    stockQuantity: number;
    isActive: boolean;
}

export type CreateProductDto = {
    sku?: string;
    name: string;
    categoryId: string;
    brandId: string;
    retailPrice: number;
    warrantyMonths: string;
    hasSerialNumber?: boolean;
    specifications?: Record<string, any>;
    thumbnailUrl?: string;
}

export type UpdateProductDto = {
    sku?: string;
    name?: string;
    categoryId?: string;
    brandId?: string;
    retailPrice?: number;
    warrantyMonths?: string;
    hasSerialNumber?: boolean;
    specifications?: Record<string, any>;
    thumbnailUrl?: string;
    isActive?: boolean;
}

export type PagedAndFilteredProduct = PagedResult<ProductTableResponse>;