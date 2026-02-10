import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { User } from './user.entity';
import { ResignationStatus } from '@libs/shared/enums/resignation-status.enum';

@Entity('resignation_requests')
export class ResignationRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'employee_id' })
    employeeId: string;

    @Column({ name: 'approver_id', nullable: true })
    approverId: string;

    @Column()
    submitDate: Date; // Ngày nộp đơn

    @Column()
    desiredLastDay: Date; // Ngày mong muốn nghỉ

    @Column({ nullable: true })
    approvedLastDay: Date; // Ngày HR chốt (Quan trọng nhất)

    @Column()
    reason: string; // Lý do nghỉ

    @Column({ nullable: true })
    handoverNote: string; // Link bàn giao công việc (VD: Google Doc)

    @Column({ type: 'enum', enum: ResignationStatus, default: ResignationStatus.PENDING })
    status: ResignationStatus;

    @Column({ nullable: true })
    hrNote: string; // Ghi chú của HR (Exit Interview feedback)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Người duyệt
    @ManyToOne(() => User, user => user.approvedResignationRequests, { nullable: true })
    @JoinColumn({ name: 'approver_id' })
    approver: User;

    @ManyToOne(() => Employee, employee => employee.resignationRequests)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;
}