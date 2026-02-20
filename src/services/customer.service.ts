import { Customer } from "@/entities/customer.entity";
import { CustomerRepository } from "@/repositories/customer.repository";
import { CustomerTier } from "@libs/shared/enums/customer-tier.enum";
import { Injectable, NotFoundException } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { createHash } from "crypto";

@Injectable()
export class CustomerService {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly redisService: RedisService,
    ) { }

    async findAllFilteredAndPaged(
        fullName?: string,
        phoneNumber?: string,
        tier?: CustomerTier,
        isActive?: boolean,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Customer[], total: number }> {
        const rawKey = JSON.stringify({ fullName, phoneNumber, tier, isActive, page: page || 1, pageSize: pageSize || 10 });
        const cacheKey = `customers:${createHash('md5').update(rawKey).digest('hex')}`;
        const cached = await this.redisService.get<{ items: Customer[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await this.customerRepository.findAllFilteredAndPaged(
            fullName,
            phoneNumber,
            tier,
            isActive,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async findById(id: string): Promise<Customer | null> {
        return this.customerRepository.findOne({ where: { id } });
    }

    // Tra cứu nhanh lúc tạo đơn hàng (Sale gõ SĐT khách để tìm)
    async findByPhone(phoneNumber: string) {
        const customer = await this.customerRepository.findOne({ where: { phoneNumber } });
        if (!customer) throw new NotFoundException('Customer not found');
        return customer;
    }

    async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
        const customer = this.customerRepository.create(customerData);
        const result = await this.customerRepository.save(customer);
        await this.redisService.delByPrefix('customers:');
        return result;
    }

    async updateCustomer(id: string, updateData: Partial<Customer>): Promise<Customer> {
        const customer = await this.customerRepository.findOne({ where: { id } });
        if (!customer) {
            throw new NotFoundException("Customer not found");
        }
        // Nếu đổi SĐT, phải check xem SĐT mới có bị trùng với người khác không
        if (updateData.phoneNumber && updateData.phoneNumber !== customer.phoneNumber) {
            const exist = await this.customerRepository.findOne({ where: { phoneNumber: updateData.phoneNumber } });
            if (exist) throw new NotFoundException('Phone number already in use by another customer');
        }
        Object.assign(customer, updateData);
        const result = await this.customerRepository.save(customer);
        await this.redisService.delByPrefix('customers:');
        return result;
    }

    async deleteCustomer(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            throw new NotFoundException("No customer IDs provided for deletion");
        }
        await this.customerRepository.delete(ids);
        await this.redisService.delByPrefix('customers:');
    }
}
