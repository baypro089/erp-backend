import { TerminationRequest } from "@/entities/termination-request.entity";
import { EmployeesMapper } from "./employees.mapper";
import { UsersMapper } from "./users.mapper";
import { PayslipsMapper } from "./payslips.mapper";
import { TerminationApproveResponse, TerminationRequestResponse } from "@libs/shared/types/termination-request.type";
import { Payslip } from "@/entities/payslip.entity";

export class TerminationRequestMapper {
  static toResponse(entity: TerminationRequest): TerminationRequestResponse {
    return {
      id: entity.id,
      employee: EmployeesMapper.toResponse(entity.employee),
      terminationDate: entity.terminationDate,
      terminationReason: entity.terminationReason,
      status: entity.status,
      document: entity.document,
      isReassigned: entity.isReassigned,
      terminatedBy: entity.terminatedBy ? UsersMapper.toDTO(entity.terminatedBy) : undefined,
      terminatedAt: entity.terminatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toApproveResponse(entity: TerminationRequest, payslip: Payslip): TerminationApproveResponse {
    return {
      terminationRequest: this.toResponse(entity),
      payslip: PayslipsMapper.toResponse(payslip),
    };
  }

  static toResponseList(entities: TerminationRequest[]): TerminationRequestResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}
