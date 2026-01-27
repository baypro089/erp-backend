import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';
import { PagedResult } from './pagedResult.type';
import { EmployeeResponse } from './employees.type';
import { PositionResponse } from './positions.type';

export type JobHistoryResponse = {
  id: string;
  employee: EmployeeResponse;
  position: PositionResponse;
  startDate: Date;
  endDate: Date | null;
  salaryAtTime: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JobHistoryResponseList = {
  items: JobHistoryResponse[];
  total: number;
};

export type PagedAndFilteredJobHistory = PagedResult<JobHistoryResponse>;
