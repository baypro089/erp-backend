import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('salary_components')
export class SalaryComponent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // VD: "Phụ cấp ăn trưa", "Bảo hiểm xã hội"

  @Column({ unique: true })
  code: string; // VD: "LUNCH", "BHXH" (Dùng làm key trong JSON)

  @Column({ type: 'enum', enum: ['EARNING', 'DEDUCTION'] })
  type: string; // Là khoản CỘNG vào hay TRỪ đi

  @Column({ default: false })
  isSystem: boolean; // True = Hệ thống tự tính (BHXH), False = Nhập tay hoặc cố định
}