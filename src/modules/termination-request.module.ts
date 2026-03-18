import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TerminationRequest } from "@/entities/termination-request.entity";
import { TerminationRequestRepository } from "@/repositories/termination-request.repository";
import { TerminationRequestService } from "@/services/termination-request.service";
import { TerminationRequestController } from "@/controllers/termination-request.controller";
import { PayslipModule } from "./payslip.module";

@Module({
  imports: [TypeOrmModule.forFeature([TerminationRequest]), PayslipModule],
  controllers: [TerminationRequestController],
  providers: [TerminationRequestRepository, TerminationRequestService],
  exports: [TerminationRequestService, TerminationRequestRepository],
})
export class TerminationRequestModule {}
