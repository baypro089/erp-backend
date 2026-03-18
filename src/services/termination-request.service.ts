import { CreateTerminationRequestDto, RestoreTerminationRequestDto } from "@/dtos/termination-request.dto";
import { Department } from "@/entities/department.entity";
import { Employee } from "@/entities/employee.entity";
import { Payslip } from "@/entities/payslip.entity";
import { TerminationRequest } from "@/entities/termination-request.entity";
import { User } from "@/entities/user.entity";
import { PayslipService } from "@/services/payslip.service";
import { TerminationRequestRepository } from "@/repositories/termination-request.repository";
import { EMPLOYEE_PERMISSIONS } from "@libs/shared/constants/permissions.constant";
import { PORTAL_PERMISSIONS } from "@libs/shared/constants/portal-permissions.constant";
import { Status } from "@libs/shared/enums/employee-status.enum";
import { TerminationStatus } from "@libs/shared/enums/termination-status.enum";
import { UserStatus } from "@libs/shared/enums/user-status.enum";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import { DataSource } from "typeorm";
import { RedisService } from "./redis.service";

@Injectable()
export class TerminationRequestService {
  constructor(
    private readonly terminationRequestRepository: TerminationRequestRepository,
    private readonly payslipService: PayslipService,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateTerminationRequestDto): Promise<TerminationRequest> {
    const employee = await this.dataSource.getRepository(Employee).findOne({
      where: { id: dto.employeeId },
      relations: ["user"],
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    if ([Status.RESIGNED, Status.TERMINATED].includes(employee.status)) {
      throw new BadRequestException("Nhân viên đã nghỉ việc/sa thải, không thể tạo yêu cầu sa thải mới");
    }

    const existingPending = await this.terminationRequestRepository.findOne({
      where: {
        employee: { id: dto.employeeId },
        status: TerminationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException("Đã tồn tại yêu cầu sa thải đang chờ duyệt cho nhân viên này");
    }

    const entity = this.terminationRequestRepository.create({
      employee: { id: dto.employeeId } as Employee,
      terminationDate: dto.terminationDate,
      terminationReason: dto.terminationReason,
      document: dto.document ?? null,
      status: TerminationStatus.PENDING,
      isReassigned: false,
      terminatedAt: null,
      terminatedBy: null,
    });

    const result = await this.terminationRequestRepository.save(entity);
    await this.redisService.delByPrefix("termination_requests:");
    return result;
  }

  async approve(id: string, approverId: string): Promise<{ request: TerminationRequest; payslip: Payslip }> {
    return this.dataSource.transaction(async (manager) => {
      const terminationRepo = manager.getRepository(TerminationRequest);
      const userRepo = manager.getRepository(User);

      const request = await terminationRepo.findOne({
        where: { id },
        relations: ["employee", "employee.user", "employee.user.role", "terminatedBy", "terminatedBy.role"],
      });

      if (!request) {
        throw new NotFoundException("Termination request not found");
      }

      if (request.status !== TerminationStatus.PENDING) {
        throw new BadRequestException("Yêu cầu sa thải không ở trạng thái chờ duyệt");
      }

      const approver = await userRepo.findOne({
        where: { id: approverId },
        relations: ["role"],
      });

      if (!approver) {
        throw new NotFoundException("Approver not found");
      }

      request.status = TerminationStatus.APPROVED;
      request.terminatedAt = new Date();
      request.terminatedBy = approver;

      await manager.getRepository(Employee).update(request.employee.id, {
        status: Status.TERMINATED,
      });

      if (request.employee.user) {
        await manager.getRepository(User).update(request.employee.user.id, {
          isActive: false,
          status: UserStatus.BANNED,
        });

        await this.redisService.del(`refresh_token:${request.employee.user.id}`);
        await this.redisService.set(`banned:${request.employee.user.id}`, "true");
      }

      const savedRequest = await terminationRepo.save(request);

      const hydratedRequest = await terminationRepo.findOne({
        where: { id: savedRequest.id },
        relations: ["employee", "employee.user", "employee.user.role", "terminatedBy", "terminatedBy.role"],
      });

      if (!hydratedRequest) {
        throw new NotFoundException("Termination request not found after approval");
      }

      const month = new Date(hydratedRequest.terminationDate).getMonth() + 1;
      const year = new Date(hydratedRequest.terminationDate).getFullYear();
      const payslip = await this.payslipService.calculatePayslip(hydratedRequest.employee.id, month, year, manager);

      await this.clearCaches();
      return { request: hydratedRequest, payslip };
    });
  }

  async reject(id: string): Promise<TerminationRequest> {
    const request = await this.terminationRequestRepository.findOne({
      where: { id },
      relations: ["employee", "employee.user", "employee.user.role", "terminatedBy", "terminatedBy.role"],
    });

    if (!request) {
      throw new NotFoundException("Termination request not found");
    }

    if (request.status !== TerminationStatus.PENDING) {
      throw new BadRequestException("Yêu cầu sa thải không ở trạng thái chờ duyệt");
    }

    request.status = TerminationStatus.REJECTED;
    const result = await this.terminationRequestRepository.save(request);
    await this.redisService.delByPrefix("termination_requests:");
    return result;
  }

  async updateReassignStatus(id: string, isReassigned: boolean): Promise<TerminationRequest> {
    const request = await this.terminationRequestRepository.findOne({
      where: { id },
      relations: ["employee", "employee.user", "employee.user.role", "terminatedBy", "terminatedBy.role"],
    });

    if (!request) {
      throw new NotFoundException("Termination request not found");
    }

    if (request.status !== TerminationStatus.APPROVED) {
      throw new BadRequestException("Chỉ được cập nhật bàn giao tài sản sau khi yêu cầu đã được duyệt");
    }

    request.isReassigned = isReassigned;
    const result = await this.terminationRequestRepository.save(request);

    await this.redisService.delByPrefix("termination_requests:");
    return result;
  }

  async restore(id: string, restoredByUserId: string, dto: RestoreTerminationRequestDto): Promise<TerminationRequest> {
    return this.dataSource.transaction(async (manager) => {
      const terminationRepo = manager.getRepository(TerminationRequest);

      const request = await terminationRepo.findOne({
        where: { id },
        relations: ["employee", "employee.user", "employee.user.role", "terminatedBy", "terminatedBy.role"],
      });

      if (!request) {
        throw new NotFoundException("Termination request not found");
      }

      if (request.status !== TerminationStatus.APPROVED) {
        throw new BadRequestException("Chỉ có thể restore yêu cầu sa thải đã duyệt");
      }

      const month = new Date(request.terminationDate).getMonth() + 1;
      const year = new Date(request.terminationDate).getFullYear();

      const payslip = await manager.getRepository(Payslip).findOne({
        where: {
          employee: { id: request.employee.id },
          month,
          year,
        },
        relations: ["employee", "employee.user", "employee.user.role"],
      });

      const obligationsCompleted = request.isReassigned && !!payslip;
      const forceRestore = !!dto.forceRestore;

      if (!obligationsCompleted && !forceRestore) {
        throw new BadRequestException(
          "Không thể restore trước khi hoàn tất nghĩa vụ (bàn giao tài sản + bảng lương). HR có thể forceRestore nếu sa thải nhầm.",
        );
      }

      if (forceRestore && !dto.restoreReason?.trim()) {
        throw new BadRequestException("restoreReason là bắt buộc khi forceRestore = true");
      }

      await manager.getRepository(Employee).update(request.employee.id, {
        status: Status.ACTIVE,
      });

      if (request.employee.user) {
        await manager.getRepository(User).update(request.employee.user.id, {
          isActive: true,
          status: UserStatus.ACTIVE,
        });

        await this.redisService.del(`refresh_token:${request.employee.user.id}`);
        await this.redisService.del(`banned:${request.employee.user.id}`);
      }

      request.status = TerminationStatus.REJECTED;
      request.terminatedAt = null;
      request.terminatedBy = null;

      const restored = await terminationRepo.save(request);
      await this.clearCaches();
      return restored;
    });
  }

  async findAllFilteredAndPaged(
    userId: string,
    status?: string,
    employeeName?: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ items: TerminationRequest[]; total: number }> {
    let departmentId: string | undefined = undefined;

    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ["employee", "role", "role.permissions"],
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    const permissions = user.role?.permissions ?? [];
    const isAdmin = permissions.some((p) => p.permission_code === PORTAL_PERMISSIONS.ADMIN);
    const isHR = permissions.some((p) => p.permission_code === EMPLOYEE_PERMISSIONS.CREATE);

    if (!isAdmin && !isHR) {
      if (user.employee) {
        const managedDepartment = await this.dataSource.getRepository(Department).findOne({
          where: { managerId: user.employee.id },
        });

        if (!managedDepartment) {
          return { items: [], total: 0 };
        }

        departmentId = managedDepartment.id;
      } else {
        return { items: [], total: 0 };
      }
    }

    const effectivePage = page || 1;
    const effectivePageSize = pageSize || 10;
    const rawKey = JSON.stringify({
      status,
      employeeName,
      departmentId,
      page: effectivePage,
      pageSize: effectivePageSize,
    });
    const cacheKey = `termination_requests:${createHash("md5").update(rawKey).digest("hex")}`;

    const cached = await this.redisService.get<{ items: TerminationRequest[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.terminationRequestRepository.findAllFilteredAndPaged(
      status,
      employeeName,
      departmentId,
      effectivePage,
      effectivePageSize,
    );

    await this.redisService.set(cacheKey, result, 300);
    return result;
  }

  async getById(id: string): Promise<{ terminationRequest: TerminationRequest, payslip: Payslip}> {
    const result = await this.terminationRequestRepository.findOne({
      where: { id },
      relations: ["employee", "terminatedBy", "terminatedBy.role"],
    });
    if (!result) {
      throw new NotFoundException("Termination request not found");
    }
    const month = new Date(result.terminationDate).getMonth() + 1;
    const year = new Date(result.terminationDate).getFullYear();
    const payslip = await this.dataSource.getRepository(Payslip).findOne({
      where: {
        employee: { id: result.employee.id },
        month,
        year,
      },
      relations: ["employee", "employee.user", "employee.user.role"],
    });

    if (!payslip) {
      throw new NotFoundException("Payslip not found");
    }

    return { terminationRequest: result, payslip };
  }

  async findAllByEmployeeId(employeeId: string): Promise<TerminationRequest[]> {
    return this.terminationRequestRepository.find({
      where: { employee: { id: employeeId } },
      relations: ["employee", "terminatedBy", "terminatedBy.role"],
      order: { createdAt: "DESC" },
    });
  }

  private async clearCaches(): Promise<void> {
    await this.redisService.delByPrefix("termination_requests:");
    await this.redisService.delByPrefix("payslips:all:");
    await this.redisService.delByPrefix("my_payslips:");
    await this.redisService.delByPrefix("users:");
    await this.redisService.del("all_users");
    await this.redisService.delByPrefix("employees:");
    await this.redisService.del("all_employees");
  }
}
