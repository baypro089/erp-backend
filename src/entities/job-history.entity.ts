
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
import { Position } from './position.entity';
import { Department } from './department.entity';

@Entity({ name: 'job_histories' })
export class JobHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'uuid', name: 'position_id' })
  positionId: string;

  @Column({ type: 'uuid', name: 'department_id' })
  departmentId: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date', nullable: true })
  endDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'salary_at_time' })
  salaryAtTime: number;

  @Column({ nullable: true })
  note: string;

  @Column({ default: true , name: 'is_current' })
  isCurrent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Employee, (employee) => employee.jobHistories)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Position, (position) => position.jobHistories)
  @JoinColumn({ name: 'position_id' })
  position: Position;

  @ManyToOne(() => Department, (department) => department.jobHistories)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
