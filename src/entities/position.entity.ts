
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { JobHistory } from './job-history.entity';

@Entity({ name: 'positions' })
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_salary' })
  baseSalary: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => Employee, (employee) => employee.currentPosition)
  employees: Employee[];

  @OneToMany(() => JobHistory, (jobHistory) => jobHistory.position)
  jobHistories: JobHistory[];
}
