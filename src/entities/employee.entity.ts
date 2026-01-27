import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';
import { Position } from './position.entity';
import { JobHistory } from './job-history.entity';
import { LeaveRequest } from './leave-request.entity';
import { Payslip } from './payslip.entity';
import { Gender } from '@libs/shared/enums/gender.enum';
import { Level } from '@libs/shared/enums/level.enum';
import { Status } from '@libs/shared/enums/employee-status.enum';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //==== Thông tin cá nhân ====//
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 200, name: 'full_name' })
  fullName: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'varchar', nullable: true })
  photo: string;

  @Column({ nullable: true, name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ length: 20, name: 'identity_number', nullable: true })
  identityNumber: string;

  @Column({ name: 'identity_issued_date', nullable: true })
  identityIssuedDate: Date;

  @Column({ length: 200, name: 'identity_issued_place', nullable: true })
  identityIssuedPlace: string;

  @Column({ length: 50, nullable: true })
  nationality: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 200, name: 'address_permanent', nullable: true })
  addressPermanent: string;

  @Column({ length: 200, name: 'address_current', nullable: true })
  addressCurrent: string;

  //==== Thông tin công việc ====//
  @Column({ length: 50, name: 'employee_code', unique: true })
  employeeCode: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ type: 'enum', enum: Level, default: Level.JUNIOR })
  level: Level;

  @Column({ type: 'uuid', name: 'manager_id', nullable: true })
  managerId: string;

  @Column({ type: 'uuid', name: 'department_id' })
  departmentId: string;

  @Column({ type: 'uuid', name: 'current_position_id' })
  currentPositionId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'enum', enum: Status, default: Status.DRAFT })
  status: Status;

  @OneToOne(() => User, (user) => user.employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => Position)
  @JoinColumn({ name: 'current_position_id' })
  currentPosition: Position;

  @OneToMany(() => JobHistory, (jobHistory) => jobHistory.employee)
  jobHistories: JobHistory[];

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequests: LeaveRequest[];

  @OneToMany(() => Payslip, (payslip) => payslip.employee)
  payslips: Payslip[];

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @OneToMany(() => Employee, (employee) => employee.manager)
  subordinates: Employee[];
}