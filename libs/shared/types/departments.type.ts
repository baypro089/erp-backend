import { PagedResult } from './pagedResult.type';

export type DepartmentResponse = {
  id: string;
  name: string;
  managerId?: string;
  totalEmployees: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateDepartmentDTO = {
  name: string;
  description?: string;
};

export type UpdateDepartmentDTO = {
  name?: string;
  description?: string;
  managerId?: string;
};


export type PagedAndFilteredDepartment = PagedResult<DepartmentResponse>;
