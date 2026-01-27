import { CreateEmployeeDto } from "@/dtos/employees.dto";
import { Employee } from "@/entities/employee.entity";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { EmployeeResponse, PagedAndFilteredEmployee } from "@libs/shared/types/employees.type";
import { Injectable, Inject } from "@nestjs/common";
import { createHash } from 'crypto';
import { RedisService } from "./redis.service";
import { DepartmentRepository } from "@/repositories/department.repository";
import { PositionRepository } from "@/repositories/position.repository";


@Injectable()
export class EmployeeService {
    // Define your service methods for employee operations here
    constructor(
        private readonly employeeRepository: EmployeeRepository,
        private readonly departmentRepository: DepartmentRepository,
        private readonly positionRepository: PositionRepository,
        private readonly redisService: RedisService,
    ) { }

    async getAllEmployees(): Promise<Employee[]> {
        const cacheKey = 'all_employees';
        const cachedEmployees: Employee[] | undefined | null = await this.redisService.get(cacheKey);
        if (cachedEmployees) {
            return cachedEmployees;
        }
        const employees = await this.employeeRepository.findAllEmployees();
        await this.redisService.set(cacheKey, employees, 300); // Cache for 5 minutes
        return employees;
    }

    async getAlllEmployeesOptional(
        employeeCode?: string,
        fullName?: string,
        departmentId?: string,
        positionId?: string,
        startDateFrom?: Date,
        startDateTo?: Date,
        level?: string,
        status?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Employee[], total: number }> {

        const rawKey = JSON.stringify({
            employeeCode,
            fullName,
            departmentId,
            positionId,
            startDateFrom,
            startDateTo,
            level,
            status,
            page: page || 1,
            pageSize: pageSize || 10,
        });

        const cacheKey = `employees:${createHash('md5').update(rawKey).digest('hex')}`;
        const cachedResult = await this.redisService.get<{ items: Employee[]; total: number }>(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        const result = await this.employeeRepository.findAllEmployeesOptional(
            employeeCode,
            fullName,
            departmentId,
            positionId,
            startDateFrom,
            startDateTo,
            level,
            status,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300); // Cache for 5 minutes
        return result;
    }

    async getAllDeletedEmployeesOptional(
        employeeCode?: string,
        fullName?: string,
        departmentId?: string,
        positionId?: string,
        startDateFrom?: Date,
        startDateTo?: Date,
        level?: string,
        status?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Employee[], total: number }> {
        const rawKey = JSON.stringify({
            employeeCode,
            fullName,
            departmentId,
            positionId,
            startDateFrom,
            startDateTo,
            level,
            status,
            page: page || 1,
            pageSize: pageSize || 10,
        });
        const cacheKey = `deleted_employees:${createHash('md5').update(rawKey).digest('hex')}`;
        const cachedResult = await this.redisService.get<{ items: Employee[]; total: number }>(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        const result = await this.employeeRepository.findAllDeletedEmployeesOptional(
            employeeCode,
            fullName,
            departmentId,
            positionId,
            startDateFrom,
            startDateTo,
            level,
            status,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300); // Cache for 5 minutes
        return result;
    }

    async getEmployeeById(id: string): Promise<Employee | null> {
        return this.employeeRepository.findById(id);
    }

    async getEmployeeByCode(employeeCode: string): Promise<Employee | null> {
        return this.employeeRepository.findByCode(employeeCode);
    }

    async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
        const department = await this.departmentRepository.findById(employeeData.departmentId!);
        if (!department) {
            throw new Error(`Department not found: ${employeeData.departmentId}`);
        }
        const position = await this.positionRepository.findById(employeeData.currentPositionId!);
        if (!position) {
            throw new Error(`Position not found: ${employeeData.currentPositionId}`);
        }

        // Chuẩn bị dữ liệu để lưu
        const dataToSave: Partial<Employee> = {
            fullName: employeeData.fullName,
            startDate: new Date(employeeData.startDate!), // Chuyển sang Date
            employeeCode: employeeData.employeeCode,
            department,
            currentPosition: position,
        };

        const newEmployee = await this.employeeRepository.createEmployee(dataToSave);
        console.log('Creating Employee in Service:', newEmployee);
        await this.redisService.delByPrefix('employees:');
        await this.redisService.del('all_employees');
        return newEmployee;
    }

    async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee | null> {
        if (employeeData.departmentId) {
            const department = await this.departmentRepository.findById(employeeData.departmentId);
            if (!department) {
                throw new Error(`Department not found: ${employeeData.departmentId}`);
            }
            employeeData.department = department;
        }
        if (employeeData.currentPositionId) {
            const position = await this.positionRepository.findById(employeeData.currentPositionId);
            if (!position) {
                throw new Error(`Position not found: ${employeeData.currentPositionId}`);
            }
            employeeData.currentPosition = position;
        }

        const updatedEmployee = await this.employeeRepository.updateEmployee(id, employeeData);
        await this.redisService.delByPrefix('employees:');
        await this.redisService.del('all_employees');
        return updatedEmployee;
    }

    async deleteEmployees(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) {
            return;
        }
        await this.employeeRepository.deleteEmployees(ids);
        await this.redisService.delByPrefix('employees:');
        await this.redisService.del('all_employees');
    }
}