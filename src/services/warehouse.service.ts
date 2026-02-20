import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WarehouseRepository } from '@/repositories/warehouse.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { CreateWarehouseDTO, UpdateWarehouseDTO } from '@/dtos/warehouse.dto';
import { Employee } from '@/entities/employee.entity';
import { Warehouse } from '@/entities/warehouse.entity';
import { RedisService } from './redis.service';

@Injectable()
export class WarehouseService {
    constructor(
        private readonly warehouseRepository: WarehouseRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly redisService: RedisService,
    ) { }

    async createWarehouse(dto: CreateWarehouseDTO): Promise<Warehouse> {
        // 1. Check trùng Code
        const exists = await this.warehouseRepository.findOne({ where: { code: dto.code } });
        if (exists) throw new BadRequestException(`Mã kho ${dto.code} đã tồn tại!`);

        // 2. Check Manager tồn tại (nếu có truyền lên)
        if (dto.managerId) {
            const manager = await this.employeeRepository.findOneBy({ id: dto.managerId });
            if (!manager) throw new NotFoundException('Nhân viên quản lý không tồn tại');
        }

        const warehouse = this.warehouseRepository.create({
            ...dto,
            manager: { id: dto.managerId }, // Gán object relation
            isActive: true
        });

        const result = await this.warehouseRepository.save(warehouse);
        await this.redisService.del('all_warehouses');
        return result;
    }

    async findAllWarehouses(): Promise<Warehouse[]> {
        const cacheKey = 'all_warehouses';
        const cached = await this.redisService.get<Warehouse[]>(cacheKey);
        if (cached) return cached;

        const result = await this.warehouseRepository.find({
            relations: ['manager'], // Lấy luôn thông tin thủ kho
            order: { createdAt: 'DESC' }
        });
        await this.redisService.set(cacheKey, result, 300);
        return result;
    }

    async findOneWarehouse(id: string): Promise<Warehouse> {
        const wh = await this.warehouseRepository.findOne({
            where: { id },
            relations: ['manager']
        });
        if (!wh) throw new NotFoundException('Kho không tồn tại');
        return wh;
    }

    async updateWarehouse(id: string, dto: UpdateWarehouseDTO): Promise<Warehouse> {
        const wh = await this.findOneWarehouse(id);

        // Nếu update manager thì phải check lại
        if (dto.managerId) {
            const manager = await this.employeeRepository.findOneBy({ id: dto.managerId });
            if (!manager) throw new NotFoundException('Nhân viên quản lý không tồn tại');
            wh.manager = manager;
        }
        Object.assign(wh, dto); // Merge data mới vào data cũ
        const result = await this.warehouseRepository.save(wh);
        await this.redisService.del('all_warehouses');
        return result;
    }

    async removeWarehouse(ids: string[]): Promise<Warehouse[]> {
        // Không bao giờ xóa vật lý (Hard Delete) kho hàng vì dính foreign key đến lịch sử tồn kho
        // Chỉ chuyển isActive = false (Soft Delete logic)
        const warehouses: Warehouse[] = [];
        for (const id of ids) {
            await this.warehouseRepository.update(id, { isActive: false });
            warehouses.push(await this.findOneWarehouse(id));
        }
        await this.redisService.del('all_warehouses');
        return warehouses;  
    }
}