import { CreateEmployeeDto } from "@/dtos/employees.dto";
import { Employee } from "@/entities/employee.entity";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { EmployeeResponse, PagedAndFilteredEmployee } from "@libs/shared/types/employees.type";
import { Injectable, Inject } from "@nestjs/common";
import { createHash } from 'crypto';
import { RedisService } from "./redis.service";
import { DepartmentRepository } from "@/repositories/department.repository";
import { PositionRepository } from "@/repositories/position.repository";
import { DataSource, In } from "typeorm";
import { Department } from "@/entities/department.entity";
import { Position } from "@/entities/position.entity";
import { JobHistory } from "@/entities/job-history.entity";
import { Status } from "@libs/shared/enums/employee-status.enum";


@Injectable()
export class EmployeeService {
    // Define your service methods for employee operations here
    constructor(
        private readonly employeeRepository: EmployeeRepository,
        private readonly departmentRepository: DepartmentRepository,
        private readonly positionRepository: PositionRepository,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    async getAllEmployees(permissionPortal?: string): Promise<Employee[]> {
        const normalized = (permissionPortal || 'all').toString().trim();
        const cacheKey = `all_employees:${normalized}`;
        const cachedEmployees: Employee[] | undefined | null = await this.redisService.get(cacheKey);
        if (cachedEmployees) {
            return cachedEmployees;
        }

        // Use QueryBuilder to ensure proper joins when permissions is a relation (m:n)
        const qb = this.employeeRepository.createQueryBuilder('employee')
            .leftJoinAndSelect('employee.user', 'user')
            .leftJoin('user.role', 'role')
            .leftJoin('role.permissions', 'perm')
            .where('employee.status IN (:...statuses)', { statuses: [Status.ACTIVE, Status.PROBATION] });

        if (permissionPortal) {
            qb.andWhere('perm.permission_code = :permCode', { permCode: permissionPortal });
        }

        // Select only employee fields to reduce payload; adjust if callers need relations
        qb.select(['employee.id', 'employee.fullName', 'employee.employeeCode', 'employee.startDate']);

        const employees = await qb.getMany();
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

    async createEmployee(employeeData: CreateEmployeeDto): Promise<Employee> {
        return this.dataSource.transaction(async (manager) => {

            const department = await manager.getRepository(Department)
                .findOne({ where: { id: employeeData.departmentId } });
            if (!department) {
                throw new Error(`Department not found: ${employeeData.departmentId}`);
            }

            const position = await manager.getRepository(Position)
                .findOne({ where: { id: employeeData.currentPositionId } });
            if (!position) {
                throw new Error(`Position not found: ${employeeData.currentPositionId}`);
            }

            // Chuẩn bị dữ liệu để lưu
            const dataToSave = manager.getRepository(Employee).create({
                fullName: employeeData.fullName,
                startDate: new Date(employeeData.startDate!), // Chuyển sang Date
                employeeCode: employeeData.employeeCode,
                department,
                currentPosition: position,
            });

            // Tạo mới nhân viên
            const newEmployee = await manager.getRepository(Employee).save(dataToSave);
            console.log('Creating Employee in Service:', newEmployee);

            // Tạo lich sử công việc khởi tạo cho nhân viên
            const dataJobHistory = manager.getRepository(JobHistory).create({
                employee: newEmployee,
                position: position,
                department: department,
                startDate: new Date(employeeData.startDate!),
                salaryAtTime: employeeData.initSalary || 0,
                note: 'Initial job history record',
            });
            await manager.getRepository(JobHistory).save(dataJobHistory);

            await this.redisService.delByPrefix('employees:');
            await this.redisService.delByPrefix('all_employees:');

            return newEmployee;
        });
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
        await this.redisService.delByPrefix('all_employees:');
        return updatedEmployee;
    }

    async deleteEmployees(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) {
            return;
        }
        await this.employeeRepository.deleteEmployees(ids);
        await this.redisService.delByPrefix('employees:');
        await this.redisService.delByPrefix('all_employees:');
    }
}