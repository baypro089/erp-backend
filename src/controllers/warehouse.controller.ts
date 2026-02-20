import { CreateWarehouseDTO, UpdateWarehouseDTO } from "@/dtos/warehouse.dto";
import { WarehouseMapper } from "@/mappers/warehouse.mapper";
import { WarehouseService } from "@/services/warehouse.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { WarehouseResponse } from "@libs/shared/types/warehouse.type";
import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";

@Controller('warehouses')
export class WarehouseController {
    // Controller methods would go here
    constructor(
        private readonly warehouseService: WarehouseService
    ) { }

    @Get()
    async findAllWarehouses(): Promise<ApiResponse<WarehouseResponse[]>> {
        try {
            const warehouses = await this.warehouseService.findAllWarehouses();
            return ResponseHelper.send(WarehouseMapper.toResponseList(warehouses), 'Get warehouses successfully');
        }
        catch (error) {
            console.error("Error in getting warehouses", error);
            throw error;
        }
    }

    @Get(':id')
    async findOneWarehouse(@Param('id') id: string): Promise<ApiResponse<WarehouseResponse>> {
        try {
            const warehouse = await this.warehouseService.findOneWarehouse(id);
            return ResponseHelper.send(WarehouseMapper.toResponse(warehouse), 'Get warehouse successfully');
        }
        catch (error) {
            console.error("Error in getting warehouse", error);
            throw error;
        }
    }

    @Post()
    async createWarehouse(
        @Body() dto: CreateWarehouseDTO
    ): Promise<ApiResponse<WarehouseResponse>> {
        try {
            const result = await this.warehouseService.createWarehouse(dto);
            return ResponseHelper.send(WarehouseMapper.toResponse(result), 'Create warehouse successfully');
        } catch (error) {
            console.error("Error in creating warehouse", error);
            throw error;
        }
    }

    @Put(':id')
    async updateWarehouse(
        @Param('id') id: string,
        @Body() dto: UpdateWarehouseDTO
    ): Promise<ApiResponse<WarehouseResponse>> {
        try {
            const result = await this.warehouseService.updateWarehouse(id, dto);
            return ResponseHelper.send(WarehouseMapper.toResponse(result), 'Update warehouse successfully');
        } catch (error) {
            console.error("Error in updating warehouse", error);
            throw error;
        }
    }

    @Put('remove')
    async removeWarehouse(
        @Body() ids: string[]
    ): Promise<ApiResponse<WarehouseResponse[]>> {
        try {
            const result = await this.warehouseService.removeWarehouse(ids);
            return ResponseHelper.send(WarehouseMapper.toResponseList(result), 'Remove warehouses successfully');
        } catch (error) {
            console.error("Error in removing warehouse", error);
            throw error;
        }
    }
}