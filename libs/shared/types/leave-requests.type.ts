import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';
import { LeaveRequestStatus } from '../enums/leave-request-status.enum';
import { PagedResult } from './pagedResult.type';
import { EmployeeResponse } from './employees.type';

export type LeaveRequestResponse = {
  id: string;
  employee: EmployeeResponse;
  startTime: Date;
  endTime: Date;
  reason: string;
  status: LeaveRequestStatus;
  approverId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeaveRequestResponseList = {
  items: LeaveRequestResponse[];
  total: number;
};

export type PagedAndFilteredLeaveRequest = PagedResult<LeaveRequestResponse>;
