import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Role } from './role.entity';

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

  @ManyToOne(() => Role, (role) => role.users, { onDelete: "RESTRICT" })  
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

  
}