import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, PrimaryColumn } from 'typeorm';
import { Role } from '@/entities/role.entity';

@Entity('permissions')
export class Permission {
    @PrimaryColumn()
    permission_code: string;
    @Column()
    permission_name: string;
    @Column()
    type: string
    @ManyToMany(() => Role, (role) => role.permissions)
    roles: Role[];

    @Column({ default: true })
    isActive: boolean;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}