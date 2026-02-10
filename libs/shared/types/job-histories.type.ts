import { PagedResult } from './pagedResult.type';
import { EmployeeResponse } from './employees.type';
import { PositionResponse } from './positions.type';
import { DepartmentResponse } from './departments.type';

export type JobHistoryResponse = {
  id: string;
  employee: EmployeeResponse;
  position: PositionResponse;
  department: DepartmentResponse;
  startDate: Date;
  endDate?: Date;
  salaryAtTime: number;
  note: string;
  createdAt: Date;
};

export type CreateJobHistoryDto = {
  employeeId: string;
  positionId: string;
  departmentId: string;
  startDate: Date;
  endDate?: Date;
  salaryAtTime: number;
  note?: string;
};

export type UpdateJobHistoryDto = {
  positionId?: string;
  departmentId?: string;
  startDate?: Date;
  endDate?: Date;
  salaryAtTime?: number;
  note?: string;
}

export type PagedAndFilteredJobHistory = PagedResult<JobHistoryResponse>;
