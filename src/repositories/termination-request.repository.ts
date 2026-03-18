import { TerminationRequest } from "@/entities/termination-request.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class TerminationRequestRepository extends Repository<TerminationRequest> {
  constructor(private readonly dataSource: DataSource) {
    super(TerminationRequest, dataSource.createEntityManager());
  }

  async findAllFilteredAndPaged(
    status?: string,
    employeeName?: string,
    departmentId?: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ items: TerminationRequest[]; total: number }> {
    const query = this.createQueryBuilder("termination_requests")
      .leftJoinAndSelect("termination_requests.employee", "employee")
      .leftJoinAndSelect("termination_requests.terminatedBy", "terminatedBy")
      .leftJoinAndSelect("terminatedBy.role", "terminatedByRole")
      .orderBy("termination_requests.createdAt", "DESC");

    if (status) {
      query.andWhere("termination_requests.status = :status", { status });
    }

    if (employeeName) {
      query.andWhere("unaccent(employee.fullName) ILIKE unaccent(:employeeName)", { employeeName: `%${employeeName}%` });
    }

    if (departmentId) {
      query.andWhere("employee.departmentId = :departmentId", { departmentId });
    }

    if (page && pageSize) {
      const pageNum = Number(page);
      const pageSizeNum = Number(pageSize);
      query.skip((pageNum - 1) * pageSizeNum).take(pageSizeNum);
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }
}
