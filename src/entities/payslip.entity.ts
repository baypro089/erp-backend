
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity({ name: 'payslips' })
@Unique(['employee', 'month', 'year']) // Mỗi tháng chỉ có 1 phiếu lương cho 1 người
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'base_salary' })
  baseSalary: number; // Lương cứng TẠI THỜI ĐIỂM TÍNH

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'standard_work_days' }) // Công chuẩn (thường là 26 hoặc 24)
  standardWorkDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'actual_work_days' }) // Công thực tế = Chuẩn - Nghỉ không lương
  actualWorkDays: number;

  @Column({ type: 'int', default: 0, name: 'unpaid_leave_days' })
  unpaidLeaveDays: number; // Số ngày nghỉ không lương

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'final_salary' })
  finalSalary: number; ; // Con số cuối cùng chuyển khoản

  // Cột quan trọng nhất: JSON lưu chi tiết
  // VD: { "allowance": 500000, "bonus": 1000000, "insurance": 200000, "tax": 0 }
  @Column({ type: 'jsonb', default: {} })
  details: Record<string, number>;

  @Column({ default: false, name: 'is_paid' })
  isPaid: boolean; // Đã thanh toán chưa?

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Employee, (employee) => employee.payslips)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
