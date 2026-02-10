import { EmployeeResponse } from './employees.type';
import { PagedResult } from './pagedResult.type';

export type PayslipResponse = {
  id: string;
  employee: EmployeeResponse;
  month: number;
  year: number;
  baseSalary: number;
  standardWorkDays: number;
  actualWorkDays: number;
  unpaidLeaveDays: number;
  finalSalary: number;
  details: Record<string, number>;
  isPaid: boolean;
  note: string | null;
  createdAt: Date;
};

export type PagedAndFilteredPayslip = PagedResult<PayslipResponse>;

export type PayrollItemResult = {
  employeeId: string;
  employeeName: string;
  status: 'SUCCESS' | 'FAILED';
  payslipId?: string;
  error?: string;
};

export type PayrollGenerationResult = {
  month: number;
  year: number;
  totalEmployees: number;
  successCount: number;
  failedCount: number;
  items: PayrollItemResult[];
};
