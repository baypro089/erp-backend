import { JobHistory } from '@/entities/job-history.entity';
import { JobHistoryResponse } from '@libs/shared/types/job-histories.type';
import { EmployeesMapper } from './employees.mapper';
import { PositionsMapper } from './positions.mapper';
import { DepartmentsMapper } from './departments.mapper';

export class JobHistoriesMapper {
  static toResponse(jobHistory: JobHistory): JobHistoryResponse {
    return {
      id: jobHistory.id,
      employee: EmployeesMapper.toResponse(jobHistory.employee),
      position: PositionsMapper.toResponse(jobHistory.position),
      department: DepartmentsMapper.toResponse(jobHistory.department),
      startDate: jobHistory.startDate,
      endDate: jobHistory.endDate || undefined,
      salaryAtTime: Number(jobHistory.salaryAtTime),
      note: jobHistory.note,
      createdAt: jobHistory.createdAt,
    };
  }

  static toResponseList(jobHistories: JobHistory[]): JobHistoryResponse[] {
    return jobHistories.map((jobHistory) => this.toResponse(jobHistory));
  }
}

