import { HrStatisticController } from "@/controllers/hr-statistic.controller";
import { HrStatisticService } from "@/services/hr-statistic.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Employee } from "@/entities/employee.entity";
import { LeaveRequest } from "@/entities/leave-request.entity";
import { Payslip } from "@/entities/payslip.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Employee, 
            LeaveRequest, 
            Payslip
        ]),
    ],
    providers: [HrStatisticService],
    exports: [HrStatisticService],
    controllers: [HrStatisticController],
})
export class HrStatisticModule {}
