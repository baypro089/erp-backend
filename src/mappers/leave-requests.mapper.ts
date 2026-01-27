import { LeaveRequest } from '@/entities/leave-request.entity';
import { LeaveRequestResponse } from '@libs/shared/types/leave-requests.type';
import { EmployeesMapper } from './employees.mapper';

export class LeaveRequestsMapper {
  static toResponse(leaveRequest: LeaveRequest): LeaveRequestResponse {
    return {
      id: leaveRequest.id,
      employee: EmployeesMapper.toResponse(leaveRequest.employee),
      startTime: leaveRequest.startTime,
      endTime: leaveRequest.endTime,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      approverId: leaveRequest.approverId,
      createdAt: leaveRequest.createdAt,
      updatedAt: leaveRequest.updatedAt,
    };
  }

  static toResponseList(
    leaveRequests: LeaveRequest[],
  ): LeaveRequestResponse[] {
    return leaveRequests.map((leaveRequest) => this.toResponse(leaveRequest));
  }
}

