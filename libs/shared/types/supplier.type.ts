import { PagedResult } from "./pagedResult.type";

export type SupplierResponse = {
    id: string;
    name: string;
    contactPhone: string;
    address: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateSupplierDTO = {
    name: string;
    contactPhone: string;
    address: string;
}

export type UpdateSupplierDTO = {
    name?: string;
    contactPhone?: string;
    address?: string;
    isActive?: boolean;
}

export type SupplierListResponse = PagedResult<SupplierResponse>;