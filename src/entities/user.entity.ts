import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Role } from './role.entity';
import { UserStatus } from '@libs/shared/enums/user-status.enum';
import { ResignationRequest } from './resignation-request.entity';
import { LeaveRequest } from './leave-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @Column({ name: 'password_hash' })
  password: string;

  @Column({ name: 'role_code' })
  roleCode: string;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: "RESTRICT", onUpdate: "CASCADE" })  
  @JoinColumn({ name: "role_code" })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Employee, (employee) => employee.user)
  employee: Employee;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  @Column({type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @OneToMany(() => ResignationRequest, (resignationRequest) => resignationRequest.approver)
  approvedResignationRequests: ResignationRequest[];

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.approver)
  approvedLeaveRequests: LeaveRequest[];
}