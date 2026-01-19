import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '@/entities/employee.entity';
import { Department } from '@/entities/department.entity';
import { Position } from '@/entities/position.entity';
import { JobHistory } from '@/entities/job-history.entity';
import { LeaveRequest } from '@/entities/leave-request.entity';
import { Payslip } from '@/entities/payslip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      Department,
      Position,
      JobHistory,
      LeaveRequest,
      Payslip,
    ]),
  ],
  controllers: [],
  providers: [],
})
export class EmployeesModule {}
