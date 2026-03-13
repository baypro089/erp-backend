import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequest } from '@/entities/leave-request.entity';
import { LeaveRequestRepository } from '@/repositories/leave-request.repository';
import { LeaveRequestService } from '@/services/leave-request.service';
import { LeaveRequestController } from '@/controllers/leave-request.controller';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { FileModule } from './file.module';
@Module({
    imports: [TypeOrmModule.forFeature([LeaveRequest]), FileModule],
    controllers: [LeaveRequestController],
    providers: [LeaveRequestRepository, LeaveRequestService, EmployeeRepository],
    exports: [LeaveRequestRepository, LeaveRequestService],
})

export class LeaveRequestModule { }