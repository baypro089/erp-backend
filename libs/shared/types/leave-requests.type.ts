import { LeaveRequestStatus, LeaveRequestType } from '../enums/leave-request-status.enum';
import { PagedResult } from './pagedResult.type';
import { EmployeeResponse } from './employees.type';

export type LeaveRequestResponse = {
  id: string;
  employee: EmployeeResponse;
  startDate: Date;
  endDate: Date;
  duration: number;
  reason: string;
  rejectionReason?: string;
  documentUrl?: string;
  isBhxhClaimed: boolean;
  status: LeaveRequestStatus;
  type: LeaveRequestType;
  approverId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeaveRequestCreateDto = {
  employeeId: string;
  startDate: Date;
  endDate?: Date;
  type: LeaveRequestType;
  reason: string;
  documentUrl?: string;
  autoSplitIfInsufficient?: boolean;
}

export type CreateLeaveRequestPayload = {
  data: LeaveRequestCreateDto;
  documentFile?: any;
}

export type CalculateWorkingDaysDto = {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

export type PagedAndFilteredLeaveRequest = PagedResult<LeaveRequestResponse>;
