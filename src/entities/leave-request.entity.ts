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
import { LeaveRequestStatus, LeaveRequestType } from '@libs/shared/enums/leave-request-status.enum';
import { User } from './user.entity';

@Entity({ name: 'leave_requests' })
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column('decimal', { precision: 4, scale: 1 }) // Cho phép nghỉ 0.5 ngày
  duration: number; // Đây là kết quả sau khi đã trừ T7/CN

  @Column({ type: 'enum', enum: LeaveRequestType, default: LeaveRequestType.ANNUAL })
  type: LeaveRequestType;

  @Column()
  reason: string;

  @Column({ name: 'rejection_reason', nullable: true})
  rejectionReason: string;

  @Column({
    type: 'enum',
    enum: LeaveRequestStatus,
    default: LeaveRequestStatus.PENDING,
  })
  status: LeaveRequestStatus;

  @Column({ type: 'uuid', name: 'approver_id', nullable: true })
  approverId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Employee, (employee) => employee.leaveRequests)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => User, (user) => user.approvedLeaveRequests, { nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User;
}
