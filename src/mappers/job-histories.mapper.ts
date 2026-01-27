import { JobHistory } from '@/entities/job-history.entity';
import { JobHistoryResponse } from '@libs/shared/types/job-histories.type';
import { EmployeesMapper } from './employees.mapper';
import { PositionsMapper } from './positions.mapper';

export class JobHistoriesMapper {
  static toResponse(jobHistory: JobHistory): JobHistoryResponse {
    return {
      id: jobHistory.id,
      employee: EmployeesMapper.toResponse(jobHistory.employee),
      position: PositionsMapper.toResponse(jobHistory.position),
      startDate: jobHistory.startDate,
      endDate: jobHistory.endDate,
      salaryAtTime: Number(jobHistory.salaryAtTime),
      note: jobHistory.note,
      createdAt: jobHistory.createdAt,
      updatedAt: jobHistory.updatedAt,
    };
  }

  static toResponseList(jobHistories: JobHistory[]): JobHistoryResponse[] {
    return jobHistories.map((jobHistory) => this.toResponse(jobHistory));
  }
}

