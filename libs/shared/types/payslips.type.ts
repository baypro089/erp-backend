import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';

export type PayslipResponse = {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  standardWorkDays: number;
  actualWorkDays: number;
  totalSalary: number;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PayslipResponseList = {
  items: PayslipResponse[];
  total: number;
};

export type PagedAndFilteredPayslip = PagedResponse<PayslipResponse>;
