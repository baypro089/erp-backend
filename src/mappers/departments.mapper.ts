import { Department } from '@/entities/department.entity';
import { DepartmentResponse } from '@libs/shared/types/departments.type';

export class DepartmentsMapper {
  static toResponse(department: Department): DepartmentResponse {
    return {
      id: department.id,
      name: department.name,
      description: department.description,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      totalEmployees: 0, // This field can be populated later as needed
    };
  }

  static toResponseList(departments: Department[]): DepartmentResponse[] {
    return departments.map((department) => this.toResponse(department));
  }
}

