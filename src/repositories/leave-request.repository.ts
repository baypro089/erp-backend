import { LeaveRequest } from "@/entities/leave-request.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class LeaveRequestRepository extends Repository<LeaveRequest> {
    // Repository methods would go here
    constructor(private dataSource: DataSource) {
        super(LeaveRequest, dataSource.createEntityManager());
    }

    async findAll(
        userId: string,
        roleCode?: string,
        status?: string,
        startDateFrom?: Date,
        startDateTo?: Date,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: LeaveRequest[], total: number }> {
        const query = this.createQueryBuilder('leave_requests')
            .leftJoinAndSelect('leave_requests.employee', 'employee')
            .orderBy('leave_requests.createdAt', 'DESC');

        if (roleCode === 'USER') {
            query.where('employee.userId = :userId', { userId });
        }
        if (status) {
            query.andWhere('leave_requests.status = :status', { status });
        }
        if (startDateFrom) {
            query.andWhere('leave_requests.startDate >= :startDateFrom', { startDateFrom });
        }
        if (startDateTo) {
            query.andWhere('leave_requests.endDate <= :startDateTo', { startDateTo });
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