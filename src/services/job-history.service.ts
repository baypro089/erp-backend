import { Department } from "@/entities/department.entity";
import { Employee } from "@/entities/employee.entity";
import { JobHistory } from "@/entities/job-history.entity";
import { Position } from "@/entities/position.entity";
import { JobHistoryRepository } from "@/repositories/job-history.repository";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class JobHistoryService {
    // Service methods would go here
    constructor(
        private dataSource: DataSource,
        private jobHistoryRepository: JobHistoryRepository,
    ) { }

    async createJobHistory(data: Partial<JobHistory>): Promise<JobHistory> {
        return this.dataSource.transaction(async (manager) => {

            // Declare repositories within the transaction
            const jobHistoryRepo = manager.getRepository(JobHistory);
            const employeeRepo = manager.getRepository(Employee);

            // Validate employee existence
            const employee = await employeeRepo.findOne({ where: { id: data.employeeId } });
            if (!employee) {
                throw new NotFoundException('Employee does not exist');
            }

            // Check for existing current job history
            const currentJobHistory = await jobHistoryRepo.findOne({
                where: {
                    employeeId: data.employeeId,
                    isCurrent: true,
                },
            });

            // Validate start date
            if (currentJobHistory && new Date(data.startDate!) <= new Date(currentJobHistory.startDate)) {
                throw new BadRequestException('New job history start date must be after the current job history start date');
            }

            // Update current job history to set end date and isCurrent to false
            if (currentJobHistory) {
                currentJobHistory.endDate = new Date(data.startDate!);
                currentJobHistory.isCurrent = false;
                await jobHistoryRepo.save(currentJobHistory);
            }

            // Create new job history record
            const newJobHistory = jobHistoryRepo.create({
                employee,
                position: { id: data.positionId} as Position,
                department: { id: data.departmentId } as Department,
                startDate: new Date(data.startDate!),
                salaryAtTime: data.salaryAtTime,
                note: data.note,
                isCurrent: true,
            });
            await jobHistoryRepo.save(newJobHistory);

            return newJobHistory;
        });
    }

    async getJobHistoriesByEmployeeId(employeeId: string): Promise<JobHistory[]> {
        return this.jobHistoryRepository.getJobHistoriesByEmployeeId(employeeId);
    }
}