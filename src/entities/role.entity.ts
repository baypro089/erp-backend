import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany, PrimaryColumn } from 'typeorm';
import { Permission } from '@/entities/permission.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role {

    @PrimaryColumn()
    role_code: string;

    @Column()
    role_name: string;

    @ManyToMany(() => Permission, (permission) => permission.roles, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'role_code', referencedColumnName: 'role_code' },
        inverseJoinColumn: { name: 'permission_code', referencedColumnName: 'permission_code' },
    })
    permissions: Permission[];

    @OneToMany(() => User, (user) => user.role)
    users: User[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}