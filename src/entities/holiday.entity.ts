import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// src/entities/holiday.entity.ts
@Entity('holidays')
export class Holiday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  name: string; // VD: Tết Nguyên Đán, Giỗ tổ Hùng Vương, Quốc Khánh, v.v.

  @Column({ type: 'text', nullable: true })
  description?: string;
}