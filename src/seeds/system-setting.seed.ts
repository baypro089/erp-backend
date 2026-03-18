import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '@/entities/system-setting';

@Injectable()
export class SystemSettingSeeder {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  async seed() {
    const settings = [
      {
        key: 'GLOBAL_LUNCH_AMOUNT',
        value: '730000',
        description: 'Phụ cấp ăn trưa toàn công ty (VNĐ/tháng)',
        isActive: true,
      },
      {
        key: 'GLOBAL_TRANSPORT_AMOUNT',
        value: '500000',
        description: 'Phụ cấp đi lại toàn công ty (VNĐ/tháng)',
        isActive: true,
      },
      {
        key: 'INSURANCE_RATE_PERCENT',
        value: '0.105',
        description: 'Tỷ lệ khấu trừ bảo hiểm xã hội (10.5%)',
        isActive: true,
      },
      {
        key: 'HEALTH_INSURANCE_RATE_PERCENT',
        value: '0.015',
        description: 'Tỷ lệ khấu trừ bảo hiểm y tế (1.5%)',
        isActive: true,
      },
      {
        key: 'UNEMPLOYMENT_INSURANCE_RATE_PERCENT',
        value: '0.01',
        description: 'Tỷ lệ khấu trừ bảo hiểm thất nghiệp (1%)',
        isActive: true,
      },
    ];

    for (const setting of settings) {
      const existing = await this.systemSettingRepository.findOne({
        where: { key: setting.key },
      });

      if (!existing) {
        await this.systemSettingRepository.save(setting);
        console.log(`✅ Created system setting: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`⏭️  System setting already exists: ${setting.key}`);
      }
    }

    console.log('🎉 System setting seeding completed!');
  }
}
