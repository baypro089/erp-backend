import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';

export type JobHistoryResponse = {
  id: string;
  employeeId: string;
  positionId: string;
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

export type PagedAndFilteredJobHistory = PagedResponse<JobHistoryResponse>;
