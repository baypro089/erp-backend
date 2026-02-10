import { JobHistory } from "@/entities/job-history.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class JobHistoryRepository extends Repository<JobHistory> {
    // Repository methods would go here
    constructor(private dataSource: DataSource) {
        super(JobHistory, dataSource.createEntityManager());
    }

    async getJobHistoriesByEmployeeId(employeeId: string): Promise<JobHistory[]> {
        return this.find({
            where: { employeeId }, 
            relations: ['employee', 'employee.department', 'employee.currentPosition', 'position', 'department'], 
            order: { startDate: 'DESC' }
        });
    }
}