import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';
import { EmployeeResponse } from './employees.type';
import { PagedResult } from './pagedResult.type';

export type PayslipResponse = {
  id: string;
  employee: EmployeeResponse;
  month: number;
  year: number;
  standardWorkDays: number;
  actualWorkDays: number;
  totalSalary: number;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PagedAndFilteredPayslip = PagedResult<PayslipResponse>;
