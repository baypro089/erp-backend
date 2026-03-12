export class TaxCalculator {
  // Các hằng số theo Luật 109/2025/QH15 (Áp dụng từ 2026)
  static readonly PERSONAL_DEDUCTION = 15500000; // 15.5 triệu
  static readonly DEPENDENT_DEDUCTION = 6200000; // 6.2 triệu

  static calculatePIT(
    grossIncome: number,
    dependentCount: number,
    mandatoryInsurance: number,
    isResident: boolean = true
  ): { assessableIncome: number; pitAmount: number } {
    
    // Nếu là cá nhân không cư trú (Người nước ngoài làm việc ngắn hạn)
    if (!isResident) {
      return {
        assessableIncome: grossIncome,
        pitAmount: grossIncome * 0.20 // Đóng phẳng 20%
      };
    }

    // 1. Tính tổng giảm trừ
    const totalDeductions = this.PERSONAL_DEDUCTION + ((dependentCount ?? 0) * this.DEPENDENT_DEDUCTION) + mandatoryInsurance;

    // 2. Thu nhập tính thuế (Không được âm)
    const assessableIncome = Math.max(0, grossIncome - totalDeductions);

    // 3. Biểu thuế lũy tiến 5 bậc mới
    let pitAmount = 0;
    const i = assessableIncome;

    if (i <= 0) {
      pitAmount = 0;
    } else if (i <= 10000000) {
      pitAmount = i * 0.05;
    } else if (i <= 30000000) {
      pitAmount = i * 0.10 - 500000;
    } else if (i <= 60000000) {
      pitAmount = i * 0.20 - 3500000;
    } else if (i <= 100000000) {
      pitAmount = i * 0.30 - 9500000;
    } else {
      pitAmount = i * 0.35 - 14500000;
    }

    return {
      assessableIncome,
      pitAmount
    };
  }
}