import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '@/entities/employee.entity';
import { Department } from '@/entities/department.entity';
import { Position } from '@/entities/position.entity';
import { JobHistory } from '@/entities/job-history.entity';
import { LeaveRequest } from '@/entities/leave-request.entity';
import { Payslip } from '@/entities/payslip.entity';

import { EmployeeRepository } from '@/repositories/employee.repository';
import { DepartmentRepository } from '@/repositories/department.repository';
import { PositionRepository } from '@/repositories/position.repository';
import { EmployeeService } from '@/services/employee.service';
import { EmployeeController } from '@/controllers/employee.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      LeaveRequest,
      Payslip,
    ]),
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeRepository,
    DepartmentRepository,
    PositionRepository,
    EmployeeService
  ],
  exports: [
    EmployeeRepository,
    DepartmentRepository,
    PositionRepository,
    EmployeeService
  ],
})
export class EmployeesModule {}
