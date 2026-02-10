import { Employee } from "@/entities/employee.entity";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { EmployeeResponse, PagedAndFilteredEmployee } from "@libs/shared/types/employees.type";
import { PagedResult } from "@libs/shared/types/pagedResult.type";
import { Injectable } from "@nestjs/common";
import { DataSource, In, IsNull, Repository } from "typeorm";

@Injectable()
export class EmployeeRepository extends Repository<Employee> {
    constructor(private dataSource: DataSource) {
        super(Employee, dataSource.createEntityManager());
    }

    async findAllEmployeesOptional(
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
        const query = this.createQueryBuilder('employee')
            .leftJoin('employee.department', 'department')
            .leftJoin('employee.currentPosition', 'position')
            .select([
                'employee.id',
                'employee.employeeCode',
                'employee.fullName',
                'employee.startDate',
                'employee.createdAt',
                'employee.updatedAt',
                'employee.status',
                'department',  
                'position', 
            ])
            .where('employee.status NOT IN (:...inactiveStatus)', { inactiveStatus: [Status.RESIGNED] });

        if (employeeCode) {
            query.andWhere('employee.employeeCode = :employeeCode', { employeeCode });
        }

        if (fullName) {
            query.andWhere('unaccent(employee.fullName) ILIKE unaccent(:fullName)', { fullName: `%${fullName}%` });
        }
        if (departmentId) {
            query.andWhere('employee.departmentId = :departmentId', { departmentId });
        }
        if (positionId) {
            query.andWhere('employee.currentPositionId = :positionId', { positionId });
        }
        if (startDateFrom) {
            query.andWhere('employee.startDate >= :startDateFrom', { startDateFrom });
        }
        if (startDateTo) {
            query.andWhere('employee.startDate <= :startDateTo', { startDateTo });
        }
        if (level) {
            query.andWhere('employee.level = :level', { level });
        }
        if (status) {
            query.andWhere('employee.status = :filterStatus', { filterStatus: status });
        }

        // Always order by createdAt
        query.orderBy('employee.createdAt', 'DESC');

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await query.getManyAndCount();

        return { items, total };
    }

    async findAllDeletedEmployeesOptional(
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
        const query = this.createQueryBuilder('employee')
            .leftJoin('employee.department', 'department')
            .leftJoin('employee.currentPosition', 'position')
            .select([
                'employee.id',
                'employee.employeeCode',
                'employee.fullName',
                'employee.startDate',
                'employee.createdAt',
                'employee.updatedAt',
                'employee.status',
                'department',  
                'position', 
            ])
            .where('employee.status IN (:...deletedStatuses)', { deletedStatuses: [Status.RESIGNED] });

        if (employeeCode) {
            query.andWhere('employee.employeeCode = :employeeCode', { employeeCode });
        }
        if (fullName) {
            query.andWhere('unaccent(employee.fullName) ILIKE unaccent(:fullName)', { fullName: `%${fullName}%` });
        }
        if (departmentId) {
            query.andWhere('employee.departmentId = :departmentId', { departmentId });
        }
        if (positionId) {
            query.andWhere('employee.currentPositionId = :positionId', { positionId });
        }
        if (startDateFrom) {
            query.andWhere('employee.startDate >= :startDateFrom', { startDateFrom });
        }
        if (startDateTo) {
            query.andWhere('employee.startDate <= :startDateTo', { startDateTo });
        }
        if (level) {
            query.andWhere('employee.level = :level', { level });
        }
        if (status) {
            query.andWhere('employee.status = :filterStatus', { filterStatus: status });
        }

        // Always order by createdAt
        query.orderBy('employee.createdAt', 'DESC');

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }

        const [items, total] = await query.getManyAndCount();

        return { items, total };
    }

    async findAllEmployees(): Promise<Employee[]> {
        return this.find({
            where: { status: In([Status.ACTIVE, Status.DRAFT]), userId: IsNull() },
            relations: ['user', 'department', 'currentPosition'],
        });
    }

    async findById(id: string): Promise<Employee | null> {
        return this.findOne({ where: { id }, relations: ['user', 'department', 'currentPosition'] });
    }

    async findByCode(employeeCode: string): Promise<Employee | null> {
        return this.findOne({ where: { employeeCode } });
    }

    async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
        const newEmployee = await this.save(this.create(employeeData));
        return this.findById(newEmployee.id) as Promise<Employee>;
    }

    async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
        await this.update(id, employeeData);
        return this.findById(id) as Promise<Employee>;
    }

    async deleteEmployees(ids: string[]): Promise<void> {
        await this.update({ id: In(ids) }, { status: Status.RESIGNED });
    }
}