import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';

export type EmployeeResponse = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  dob: Date | null;
  startDate: Date;
  departmentId: string;
  currentPositionId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EmployeeResponseList = {
  items: EmployeeResponse[];
  total: number;
};

export type PagedAndFilteredEmployee = PagedResponse<EmployeeResponse>;
