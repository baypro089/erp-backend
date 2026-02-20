import { Customer } from "@/entities/customer.entity";
import { CustomerResponse, CustomerTableResponse } from "@libs/shared/types/customer.type";

export class CustomerMapper {
    static toResponse(customer: Customer): CustomerResponse {
        return {
            id: customer.id,
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber,
            email: customer.email,
            address: customer.address,
            tier: customer.tier,
            totalSpent: customer.totalSpent,
            rewardPoints: customer.rewardPoints,
            note: customer.note,
            isActive: customer.isActive,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
        };
    }

    static toResponseList(customers: Customer[]): CustomerResponse[] {
        return customers.map(customer => this.toResponse(customer));
    }


    static toResponseTable(customer: Customer): CustomerTableResponse {
        return {
            id: customer.id,
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber,
            email: customer.email,
            tier: customer.tier,
            totalSpent: customer.totalSpent,
        };
    }

    static toResponseTableList(customers: Customer[]): CustomerTableResponse[] {
        return customers.map(customer => this.toResponseTable(customer));
    }
}