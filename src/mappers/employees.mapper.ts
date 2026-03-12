import { Employee } from '@/entities/employee.entity';
import { EmployeeResponse, EmployeeTableResponse } from '@libs/shared/types/employees.type';
import { UsersMapper } from './users.mapper';
import { DepartmentsMapper } from './departments.mapper';
import { PositionsMapper } from './positions.mapper';
import { buildPublicUrl } from '@libs/core/helpers/url.helper';

export class EmployeesMapper {
  static toResponse(employee: Employee): EmployeeResponse {
    return {
      id: employee.id,
      userId: employee.userId || undefined,
      fullName: employee.fullName,
      phone: employee.phone || undefined,
      dateOfBirth: employee.dateOfBirth || undefined,
      gender: employee.gender || undefined,
      identityIssuedDate: employee.identityIssuedDate || undefined,
      identityIssuedPlace: employee.identityIssuedPlace || undefined,
      identityNumber: employee.identityNumber || undefined,
      addressPermanent: employee.addressPermanent || undefined,
      addressCurrent: employee.addressCurrent || undefined,
      nationality: employee.nationality || undefined,
      employeeCode: employee.employeeCode,
      photoUrl: buildPublicUrl(employee.photo) || undefined,
      cvUrl: buildPublicUrl(employee.cvUrl) || undefined,
      startDate: employee.startDate,
      department:employee.department ? DepartmentsMapper.toResponse(employee.department) : undefined,
      currentPosition: employee.currentPosition ? PositionsMapper.toResponse(employee.currentPosition) : undefined,
      level: employee.level || undefined,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      status: employee.status,
      totalAnnualLeave: employee.totalAnnualLeave,
      usedAnnualLeave: employee.usedAnnualLeave,
      dependentCount: employee.dependentCount || 0,
    };
  }

  static toResponseTable(employee: Employee): EmployeeTableResponse {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      startDate: employee.startDate,
      departmentName: employee.department ? employee.department.name : undefined,
      positionName: employee.currentPosition ? employee.currentPosition.name : undefined,
      createdAt: employee.createdAt, 
      updatedAt: employee.updatedAt,
      status: employee.status,
    };
  }

  static toResponseList(employees: Employee[]): EmployeeTableResponse[] {
    return employees.map((employee) => this.toResponseTable(employee));
  }

  static toDTOList(employees: Employee[]): EmployeeResponse[] {
    return employees.map((employee) => this.toResponse(employee));
  }
}

