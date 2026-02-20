import { Supplier } from "@/entities/supplier.entity";
import { SupplierRepository } from "@/repositories/supplier.repository";
import { Injectable, NotFoundException } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { createHash } from 'crypto';

@Injectable()
export class SupplierService {
	constructor(
		private readonly supplierRepository: SupplierRepository,
		private readonly redisService: RedisService,
	) { }

	async findAllFilteredAndPaged(
		name?: string,
		contactPhone?: string,
		page?: number,
		pageSize?: number,
	): Promise<{ items: Supplier[], total: number }> {
		const rawKey = JSON.stringify({ name, contactPhone, page: page || 1, pageSize: pageSize || 10 });
		const cacheKey = `suppliers:${createHash('md5').update(rawKey).digest('hex')}`;
		const cached = await this.redisService.get<{ items: Supplier[]; total: number }>(cacheKey);
		if (cached) return cached;

		const result = await this.supplierRepository.findAllFilteredAndPaged(
			name,
			contactPhone,
			page,
			pageSize,
		);
		await this.redisService.set(cacheKey, result, 300);
		return result;
	}

	async findById(id: string): Promise<Supplier | null> {
		return this.supplierRepository.findOne({ where: { id } });
	}

	async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
		const supplier = this.supplierRepository.create(supplierData);
		const result = await this.supplierRepository.save(supplier);
		await this.redisService.delByPrefix('suppliers:');
		return result;
	}

	async updateSupplier(id: string, updateData: Partial<Supplier>): Promise<Supplier> {
		const supplier = await this.supplierRepository.findOne({ where: { id } });
		if (!supplier) {
			throw new NotFoundException("Supplier not found");
		}
		Object.assign(supplier, updateData);
        const result = await this.supplierRepository.save(supplier);
		await this.redisService.delByPrefix('suppliers:');
        return result;
    }

	async deleteSupplier(ids: string[]): Promise<void> {
		if (ids.length === 0) {
			throw new NotFoundException("No supplier IDs provided for deletion");
		}
		await this.supplierRepository.delete(ids);
		await this.redisService.delByPrefix('suppliers:');
	}
}

