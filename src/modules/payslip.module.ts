import { PayslipController } from "@/controllers/payslip.controller";
import { Payslip } from "@/entities/payslip.entity";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { PayslipRepository } from "@/repositories/payslip.repository";
import { PayslipService } from "@/services/payslip.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Payslip])],
    providers: [PayslipService, PayslipRepository, EmployeeRepository],
    controllers: [PayslipController],
    exports: [PayslipService, PayslipRepository],
})
export class PayslipModule {}