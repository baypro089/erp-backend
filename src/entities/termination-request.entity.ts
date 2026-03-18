import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TerminationStatus } from '@libs/shared/enums/termination-status.enum';
import { Employee } from './employee.entity';
import { User } from './user.entity';

@Entity({ name: 'termination_requests' })
export class TerminationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'termination_date' })
  terminationDate: Date; // Ngày dự kiến sa thải (VD: 2024-12-31)

  @Column({ name: 'termination_reason', type: 'varchar', length: 255 })
  terminationReason: string; // Lý do sa thải (VD: Vi phạm nội quy, Hiệu suất kém, Cắt giảm nhân sự...)

  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee; // Nhân viên bị sa thải

  @Column({ name: 'status', type: 'enum', enum: TerminationStatus})
  status: TerminationStatus; // Trạng thái của thủ tục sa thải (PENDING, APPROVED, REJECTED)

  @Column({ name: 'document', type: 'varchar', length: 255, nullable: true })
  document: string | null; // Đường dẫn đến file tài liệu liên quan đến thủ tục sa thải (nếu có)

  @Column({ name: 'is_reassign', type: 'boolean', default: false })
  isReassigned: boolean; // Cờ đánh dấu nếu tài sản đã được phân công lại cho nhân viên khác

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'terminated_by' })
  terminatedBy: User | null; // Người thực hiện thủ tục sa thải

  @Column({ name: 'terminated_at', type: 'timestamp', nullable: true })
  terminatedAt: Date | null; // Thời điểm thực hiện thủ tục sa thải

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}