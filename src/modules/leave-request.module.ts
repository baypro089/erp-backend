import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequest } from '@/entities/leave-request.entity';
import { LeaveRequestRepository } from '@/repositories/leave-request.repository';
import { LeaveRequestService } from '@/services/leave-request.service';
import { LeaveRequestController } from '@/controllers/leave-request.controller';
import { EmployeeRepository } from '@/repositories/employee.repository';
@Module({
    imports: [TypeOrmModule.forFeature([LeaveRequest])],
    controllers: [LeaveRequestController],
    providers: [LeaveRequestRepository, LeaveRequestService, EmployeeRepository],
    exports: [LeaveRequestRepository, LeaveRequestService],
})

export class LeaveRequestModule { }