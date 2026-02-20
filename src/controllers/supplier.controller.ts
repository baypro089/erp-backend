import { CreateSupplierDTO, UpdateSupplierDTO } from "@/dtos/supplier.dto";
import { SupplierMapper } from "@/mappers/supplier.mapper";
import { SupplierService } from "@/services/supplier.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { SupplierListResponse, SupplierResponse } from "@libs/shared/types/supplier.type";
import { Controller, Get, Param, Query, Body, Post, Put, Delete, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("suppliers")
@Controller("suppliers")
export class SupplierController {
    constructor(
        private readonly supplierService: SupplierService,
    ) { }

    @Get()
    async findAllSuppliersFilteredAndPaged(
        @Query() params: { name?: string; contactPhone?: string; page?: number; pageSize?: number },
    ): Promise<ApiResponse<SupplierListResponse>> {
        const suppliers = await this.supplierService.findAllFilteredAndPaged(
            params.name,
            params.contactPhone,
            params.page,
            params.pageSize,
        );
        const result = {
            items: SupplierMapper.toResponseList(suppliers.items),
            totalCount: suppliers.total,
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            totalPages: Math.ceil(suppliers.total / (params.pageSize || 10)),
            hasNextPage: (params.page || 1) * (params.pageSize || 10) < suppliers.total,
            hasPreviousPage: (params.page || 1) > 1,
        };
        return ResponseHelper.send(result, 'Get suppliers successfully.');
    }

    @Get(":id")
    async findSupplierById(@Param("id") id: string): Promise<ApiResponse<SupplierResponse>> {
        const supplier = await this.supplierService.findById(id);
        if (!supplier) {
            throw new NotFoundException("Supplier not found");
        }
        return ResponseHelper.send(SupplierMapper.toResponse(supplier), 'Get supplier successfully.');
    }

    @Post()
    async createSupplier(@Body() supplierData: CreateSupplierDTO): Promise<ApiResponse<SupplierResponse>> {
        const created = await this.supplierService.createSupplier(supplierData as any);
        return ResponseHelper.send(SupplierMapper.toResponse(created), 'Create supplier successfully.');
    }

    @Put(":id")
    async updateSupplier(@Param("id") id: string, @Body() updateData: Partial<UpdateSupplierDTO>): Promise<ApiResponse<SupplierResponse>> {
        const updated = await this.supplierService.updateSupplier(id, updateData as any);
        return ResponseHelper.send(SupplierMapper.toResponse(updated), 'Update supplier successfully.');
    }

    @Delete()
    async removeSuppliers(@Body("ids") ids: string[]) {
        await this.supplierService.deleteSupplier(ids);
        return ResponseHelper.send(null, 'Delete supplier successfully.');
    }
}
