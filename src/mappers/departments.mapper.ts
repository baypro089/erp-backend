import { Department } from '@/entities/department.entity';
import { DepartmentResponse } from '@libs/shared/types/departments.type';

export class DepartmentsMapper {
  static toResponse(department: Department): DepartmentResponse {
    return {
      id: department.id,
      name: department.name,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  static toResponseList(departments: Department[]): DepartmentResponse[] {
    return departments.map((department) => this.toResponse(department));
  }
}

