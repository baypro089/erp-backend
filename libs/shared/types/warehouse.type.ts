import { PagedResult } from "./pagedResult.type";
import { EmployeeResponse } from "./employees.type";
import { WarehouseType } from "../enums/warehouse-type.enum";

export type WarehouseResponse = {
    id: string;
    code: string;
    name: string;
    address?: string;
    type: WarehouseType;
    manager?: EmployeeResponse;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateWarehouseDto = {
    code: string;
    name: string;
    address?: string;
    type: string;
    managerId?: string;
};

export type UpdateWarehouseDto = {
    name?: string;
    address?: string;
    type?: string;
    isActive?: boolean;
    managerId?: string;
};