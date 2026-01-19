
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity({ name: 'payslips' })
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'standard_work_days' })
  standardWorkDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'actual_work_days' })
  actualWorkDays: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_salary' })
  totalSalary: number;

  @Column({ type: 'text', nullable: true })
  details: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => Employee, (employee) => employee.payslips)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
