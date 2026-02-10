import { Payslip } from '@/entities/payslip.entity';
import { PayslipResponse } from '@libs/shared/types/payslips.type';
import { EmployeesMapper } from './employees.mapper';

export class PayslipsMapper {
  static toResponse(payslip: Payslip): PayslipResponse {
    return {
      id: payslip.id,
      employee: EmployeesMapper.toResponse(payslip.employee),
      month: payslip.month,
      year: payslip.year,
      standardWorkDays: Number(payslip.standardWorkDays),
      actualWorkDays: Number(payslip.actualWorkDays),
      baseSalary: Number(payslip.baseSalary),
      unpaidLeaveDays: payslip.unpaidLeaveDays,
      finalSalary: Number(payslip.finalSalary),
      isPaid: payslip.isPaid,
      note: payslip.note,
      details: payslip.details,
      createdAt: payslip.createdAt,
    };
  }

  static toResponseList(payslips: Payslip[]): PayslipResponse[] {
    return payslips.map((payslip) => this.toResponse(payslip));
  }
}

