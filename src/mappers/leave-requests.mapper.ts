import { LeaveRequest } from '@/entities/leave-request.entity';
import { LeaveRequestResponse } from '@libs/shared/types/leave-requests.type';
import { EmployeesMapper } from './employees.mapper';

export class LeaveRequestsMapper {
  static toResponse(leaveRequest: LeaveRequest): LeaveRequestResponse {
    return {
      id: leaveRequest.id,
      employee: EmployeesMapper.toResponse(leaveRequest.employee),
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      reason: leaveRequest.reason,
      rejectionReason: leaveRequest.rejectionReason,
      status: leaveRequest.status,
      duration: leaveRequest.duration,
      approverId: leaveRequest.approverId,
      type: leaveRequest.type,
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

