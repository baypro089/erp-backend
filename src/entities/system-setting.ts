import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn()
  key: string; // Khóa định danh (VD: 'GLOBAL_LUNCH_ALLOWANCE')

  @Column()
  value: string; // Giá trị (Lưu string cho linh hoạt, khi dùng sẽ parse ra number)

  @Column({ nullable: true })
  description: string; // VD: "Phụ cấp ăn trưa toàn công ty 2026"

  @Column({ default: true })
  isActive: boolean; // Tắt/Bật khoản này
}