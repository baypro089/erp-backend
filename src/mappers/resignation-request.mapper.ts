import { ResignationRequest } from "@/entities/resignation-request.entity";
import { ResignationRequestResponse } from "@libs/shared/types/resignation-request.type";
import { EmployeesMapper } from "./employees.mapper";
import { UsersMapper } from "./users.mapper";

export class ResignationRequestMapper {
    static toResponse(entity: ResignationRequest): ResignationRequestResponse {
        return {
            id: entity.id,
            employee:EmployeesMapper.toResponse(entity.employee),
            approver: entity.approver ? UsersMapper.toDTO(entity.approver) : undefined,
            summitDate: entity.submitDate,
            desiredLastDay: entity.desiredLastDay,
            approvedLastDay: entity.approvedLastDay,
            reason: entity.reason,
            handoverNote: entity.handoverNote,
            hrNote: entity.hrNote,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    static toResponseList(entities: ResignationRequest[]): ResignationRequestResponse[] {
        return entities.map((entity) => this.toResponse(entity));
    }
}