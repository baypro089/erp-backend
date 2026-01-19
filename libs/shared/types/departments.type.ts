import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';

export type DepartmentResponse = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DepartmentResponseList = {
  items: DepartmentResponse[];
  total: number;
};

export type PagedAndFilteredDepartment = PagedResponse<DepartmentResponse>;
