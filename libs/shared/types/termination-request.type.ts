import { EmployeeResponse } from "./employees.type";
import { PagedResult } from "./pagedResult.type";
import { PayslipResponse } from "./payslips.type";
import { UserResponse } from "./users.type";

export type TerminationRequestResponse = {
  id: string;
  employee: EmployeeResponse;
  terminationDate: Date;
  terminationReason: string;
  status: string;
  document: string | null;
  isReassigned: boolean;
  terminatedBy?: UserResponse;
  terminatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TerminationApproveResponse = {
  terminationRequest: TerminationRequestResponse;
  payslip: PayslipResponse;
};

export type TerminationRequestListResponse = PagedResult<TerminationRequestResponse>;

export type CreateTerminationRequestDto = {
  employeeId: string;
  terminationDate: Date;
  terminationReason: string;
  document?: string;
};

export type UpdateReassignStatusDto = {
  isReassigned: boolean;
};

export type RestoreTerminationRequestDto = {
  forceRestore?: boolean;
  restoreReason?: string;
};
