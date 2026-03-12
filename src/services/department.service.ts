import { CreateDepartmentDto } from "@/dtos/departments.dto";
import { Department } from "@/entities/department.entity";
import { DepartmentRepository } from "@/repositories/department.repository";
import { Injectable } from "@nestjs/common";
import { createHash } from 'crypto';
import { RedisService } from "./redis.service";
import { DataSource } from "typeorm";
import { Employee } from "@/entities/employee.entity";


@Injectable()
export class DepartmentService {
    // Define your service methods for department operations here
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    async getAllDepartments(): Promise<Department[]> {
        const cacheKey = 'all_departments';
        const cachedDepartments: Department[] | undefined | null = await this.redisService.get(cacheKey);
        if (cachedDepartments) {
            return cachedDepartments;
        }
        const departments = await this.departmentRepository.findAllDepartments();
        await this.redisService.set(cacheKey, departments, 300); // Cache for 5 minutes
        return departments;
    }

    async getAllDepartmentsOptional(
        name?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Department[], total: number }> {

        const rawKey = JSON.stringify({
            name,
            page: page || 1,
            pageSize: pageSize || 10,
        });

        const cacheKey = `departments:${createHash('md5').update(rawKey).digest('hex')}`;
        const cachedResult = await this.redisService.get<{ items: Department[]; total: number }>(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        const result = await this.departmentRepository.findAllDepartmentsOptional(
            name,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300); // Cache for 5 minutes
        return result;
    }

    async getDepartmentById(id: string): Promise<Department | null> {
        return this.departmentRepository.findById(id);
    }

    async createDepartment(departmentData: Partial<Department>): Promise<Department> {
        const newDepartment = await this.departmentRepository.createDepartment(departmentData);
        await this.redisService.delByPrefix('departments:'); // Invalidate related caches
        await this.redisService.del('all_departments'); // Invalidate all departments cache
        return newDepartment;
    }

    async updateDepartment(id: string, departmentData: Partial<Department>): Promise<Department | null> {
        if (departmentData.managerId) {
            const managerOccupiesDepartment = await this.departmentRepository.findOne({ where: { managerId: departmentData.managerId } });
            if (managerOccupiesDepartment && managerOccupiesDepartment.id !== id) {
                throw new Error(`Manager with ID ${departmentData.managerId} already manages a department`);
            }
            const employeeBelongsDepartment = await this.dataSource.getRepository(Employee).findOne({ where: { id: departmentData.managerId, departmentId: id } });
            if (!employeeBelongsDepartment) {
                throw new Error(`Employee with ID ${departmentData.managerId} is not an employee in this department, so they cannot be assigned as manager`);
            }
        }
        const updatedDepartment = await this.departmentRepository.updateDepartment(id, departmentData);
        await this.redisService.delByPrefix('departments:'); // Invalidate related caches
        await this.redisService.del('all_departments'); // Invalidate all departments cache
        return updatedDepartment;
    }

    async deleteDepartments(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) {
            return;
        }
        await this.departmentRepository.deleteDepartments(ids);
        await this.redisService.delByPrefix('departments:'); // Invalidate related caches
        await this.redisService.del('all_departments'); // Invalidate all departments cache
    }
}
