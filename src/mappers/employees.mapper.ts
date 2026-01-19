import { Employee } from '@/entities/employee.entity';
import { EmployeeResponse } from '@libs/shared/types/employees.type';

export class EmployeesMapper {
  static toResponse(employee: Employee): EmployeeResponse {
    return {
      id: employee.id,
      userId: employee.userId,
      fullName: employee.fullName,
      phone: employee.phone,
      address: employee.address,
      dob: employee.dob,
      startDate: employee.startDate,
      departmentId: employee.departmentId,
      currentPositionId: employee.currentPositionId,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  static toResponseList(employees: Employee[]): EmployeeResponse[] {
    return employees.map((employee) => this.toResponse(employee));
  }
}

