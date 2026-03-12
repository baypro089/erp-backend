import { Payslip } from "@/entities/payslip.entity";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class PayslipRepository extends Repository<Payslip> {
    constructor(private readonly dataSource: DataSource) {
        super(Payslip, dataSource.createEntityManager());
    }

    async findAllPayslipsFilteredAndPaged(
        month?: number,
        year?: number,
        page?: number,
        pageSize?: number,
        employeeId?: string,
        departmentId?: string,
    ): Promise<{ items: Payslip[], total: number }> {
        const query = this.createQueryBuilder('payslips')
            .leftJoinAndSelect('payslips.employee', 'employee')
            .where('employee.status IN (:...statuses)', {
                statuses: [Status.ACTIVE, Status.MATERNITY_LEAVE, Status.PROBATION]
            });

        if (employeeId) {
            query.andWhere('payslips.employeeId = :employeeId', { employeeId });
        }
        if (departmentId) {
            query.andWhere('employee.departmentId = :departmentId', { departmentId });
        }
        if (month) {
            query.andWhere('payslips.month = :month', { month });
        }
        if (year) {
            query.andWhere('payslips.year = :year', { year });
        }

        query.orderBy('payslips.createdAt', 'DESC');

        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }
        const [items, total] = await query.getManyAndCount();

        return { items, total };
    }
}