import { HrReportController } from "@/controllers/hr-report.controller";
import { HrReportService } from "@/services/hr-report.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Employee } from "@/entities/employee.entity";
import { Payslip } from "@/entities/payslip.entity";
import { ResignationRequest } from "@/entities/resignation-request.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Employee, 
            Payslip,
            ResignationRequest
        ]),
    ],
    providers: [HrReportService],
    exports: [HrReportService],
    controllers: [HrReportController],
})
export class HrReportModule {}
