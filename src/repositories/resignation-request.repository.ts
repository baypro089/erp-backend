import { ResignationRequest } from "@/entities/resignation-request.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class ResignationRequestRepository extends Repository<ResignationRequest> {
    // Repository methods would go here
    constructor(private readonly dataSource: DataSource) {
        super(ResignationRequest, dataSource.createEntityManager());
    }

    async findAllFilteredAndPaged(
        status?: string,
        employeeName?: string,
        departmentId?: string,
        page?: number,
        pageSize?: number,
    ): Promise<{items: ResignationRequest[], total: number}> {
        const query = this.createQueryBuilder('resignation_requests')
            .leftJoinAndSelect('resignation_requests.employee', 'employee')
            .leftJoinAndSelect('resignation_requests.approver', 'approver')
            .leftJoinAndSelect('approver.role', 'approver_role')
            .orderBy('resignation_requests.createdAt', 'DESC');
        
        if (status) {
            query.andWhere('resignation_requests.status = :status', { status });
        }
        if (employeeName) {
            query.andWhere('unaccent(employee.fullName) ILIKE unaccent(:employeeName)', { employeeName: `%${employeeName}%` });
        }
        if (departmentId) {
            query.andWhere('employee.departmentId = :departmentId', { departmentId });
        }
        if (page && pageSize) {
            const pageNum = Number(page);
            const pageSizeNum = Number(pageSize);
            query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
        }
        const [items, total] = await query.getManyAndCount();
        return { items, total };
    }
}