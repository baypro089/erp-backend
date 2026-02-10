import { Payslip } from "@/entities/payslip.entity";
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
    ): Promise<{ items: Payslip[], total: number }> {
        const query = this.createQueryBuilder('payslips')
            .leftJoinAndSelect('payslips.employee', 'employee')
            .leftJoinAndSelect('employee.department', 'department')
            .leftJoinAndSelect('employee.currentPosition', 'position')

        if (employeeId) {
            query.andWhere('payslips.employeeId = :employeeId', { employeeId });
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