import { DepartmentResponse } from './departments.type';
import { PositionResponse } from './positions.type';
import { PagedResult } from './pagedResult.type';
import { Status } from '../enums/employee-status.enum';
import { Gender } from '../enums/gender.enum';
import { Level } from '../enums/level.enum';

export type EmployeeResponse = {
  id: string;
  userId?: string;
  fullName: string;
  gender?: Gender;
  phone?: string;
  identityNumber?: string;
  identityIssuedDate?: Date;
  identityIssuedPlace?: string;
  addressPermanent?: string;
  addressCurrent?: string;
  nationality?: string;
  dateOfBirth?: Date;
  photoUrl?: string;
  employeeCode: string;
  startDate: Date;
  level?: Level;
  department?: DepartmentResponse;
  currentPosition?: PositionResponse;
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: Status;
  totalAnnualLeave: number;
  usedAnnualLeave: number;
};

export type CreateEmployeeDto = {
  userId?: string;
  fullName: string;
  startDate: Date;
  employeeCode: string;
  departmentId: string;
  currentPositionId: string;
  initSalary?: number;
};

export type UpdateEmployeeDto = {
  userId?: string;
  fullName: string;
  gender?: Gender;
  phone?: string;
  identityNumber?: string;
  identityIssuedDate?: Date;
  identityIssuedPlace?: string;
  addressPermanent?: string;
  addressCurrent?: string;
  nationality?: string;
  dateOfBirth?: Date;
  photoUrl?: string;
  level?: Level;
  departmentId?: string;
  currentPositionId?: string;
  managerId?: string;
  status?: Status;
};


export type EmployeeTableResponse = {
  id: string;
  employeeCode: string;
  fullName: string;
  startDate: Date;
  departmentName?: string;
  positionName?: string;
  createdAt: Date;
  updatedAt: Date;
  status: Status;
};


export type PagedAndFilteredEmployee = PagedResult<EmployeeTableResponse>;
