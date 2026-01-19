import { Payslip } from '@/entities/payslip.entity';
import { PayslipResponse } from '@libs/shared/types/payslips.type';

export class PayslipsMapper {
  static toResponse(payslip: Payslip): PayslipResponse {
    return {
      id: payslip.id,
      employeeId: payslip.employeeId,
      month: payslip.month,
      year: payslip.year,
      standardWorkDays: Number(payslip.standardWorkDays),
      actualWorkDays: Number(payslip.actualWorkDays),
      totalSalary: Number(payslip.totalSalary),
      details: payslip.details,
      createdAt: payslip.createdAt,
      updatedAt: payslip.updatedAt,
    };
  }

  static toResponseList(payslips: Payslip[]): PayslipResponse[] {
    return payslips.map((payslip) => this.toResponse(payslip));
  }
}

