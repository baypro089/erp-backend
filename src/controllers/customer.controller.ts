import { CreateCustomerDTO, UpdateCustomerDTO } from "@/dtos/customer.dto";
import { CustomerMapper } from "@/mappers/customer.mapper";
import { CustomerService } from "@/services/customer.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { CustomerTier } from "@libs/shared/enums/customer-tier.enum";
import { CustomerListResponse, CustomerResponse } from "@libs/shared/types/customer.type";
import { Controller, Get, Param, Query, Body, Post, Put, Delete, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("customers")
@Controller("customers")
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
    ) { }

    @Get()
    async findAllCustomersFilteredAndPaged(
        @Query() params: {
            fullName?: string;
            phoneNumber?: string;
            tier?: CustomerTier;
            isActive?: boolean;
            page?: number;
            pageSize?: number;
        },
    ): Promise<ApiResponse<CustomerListResponse>> {
        try {
            const customers = await this.customerService.findAllFilteredAndPaged(
                params.fullName,
                params.phoneNumber,
                params.tier,
                params.isActive,
                params.page,
                params.pageSize,
            );
            const result: CustomerListResponse = {
                items: CustomerMapper.toResponseTableList(customers.items),
                totalCount: customers.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(customers.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < customers.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result, 'Get customers successfully.');
        } catch (error) {
            console.error('Error in findAllCustomersFilteredAndPaged:', error);
            throw error;
        }
    }

    @Get(":id")
    async findCustomerById(@Param("id") id: string): Promise<ApiResponse<CustomerResponse>> {
        try {
            const customer = await this.customerService.findById(id);
            if (!customer) {
                throw new NotFoundException("Customer not found");
            }
            return ResponseHelper.send(CustomerMapper.toResponse(customer), 'Get customer successfully.');
        } catch (error) {
            console.error('Error in findCustomerById:', error);
            throw error;
        }
    }

    @Get("phone/:phone")
    async findCustomerByPhone(@Param("phone") phone: string): Promise<ApiResponse<CustomerResponse>> {
        try {
            const customer = await this.customerService.findByPhone(phone);
            return ResponseHelper.send(CustomerMapper.toResponse(customer), 'Get customer successfully.');
        } catch (error) {
            console.error('Error in findCustomerByPhone:', error);
            throw error;
        }
    }

    @Post()
    async createCustomer(@Body() customerData: CreateCustomerDTO): Promise<ApiResponse<CustomerResponse>> {
        try {
            const created = await this.customerService.createCustomer(customerData);
            return ResponseHelper.send(CustomerMapper.toResponse(created), 'Create customer successfully.');
        } catch (error) {
            console.error('Error in createCustomer:', error);
            throw error;
        }
    }

    @Put(":id")
    async updateCustomer(@Param("id") id: string, @Body() updateData: UpdateCustomerDTO): Promise<ApiResponse<CustomerResponse>> {
        try {
            const updated = await this.customerService.updateCustomer(id, updateData);
            return ResponseHelper.send(CustomerMapper.toResponse(updated), 'Update customer successfully.');
        } catch (error) {
            console.error('Error in updateCustomer:', error);
            throw error;
        }
    }

    @Delete()
    async removeCustomers(@Body("ids") ids: string[]) {
        try {
            await this.customerService.deleteCustomer(ids);
            return ResponseHelper.send(null, 'Delete customer successfully.');
        } catch (error) {
            console.error('Error in removeCustomers:', error);
            throw error;
        }
    }
}
