import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryComponent } from '@/entities/salary-component';

@Injectable()
export class SalaryComponentSeeder {
  constructor(
    @InjectRepository(SalaryComponent)
    private readonly salaryComponentRepository: Repository<SalaryComponent>,
  ) {}

  async seed() {
    const components = [
      {
        code: 'LUNCH',
        name: 'Phụ cấp ăn trưa',
        type: 'EARNING',
        isSystem: false,
      },
      {
        code: 'TRANSPORT',
        name: 'Phụ cấp đi lại',
        type: 'EARNING',
        isSystem: false,
      },
      {
        code: 'BHXH',
        name: 'Bảo hiểm xã hội',
        type: 'DEDUCTION',
        isSystem: true,
      },
      {
        code: 'TAX',
        name: 'Thuế TNCN',
        type: 'DEDUCTION',
        isSystem: true,
      },
    ];

    for (const component of components) {
      const existing = await this.salaryComponentRepository.findOne({
        where: { code: component.code },
      });

      if (!existing) {
        await this.salaryComponentRepository.save(component);
        console.log(`✅ Created salary component: ${component.name}`);
      } else {
        console.log(`⏭️  Salary component already exists: ${component.name}`);
      }
    }

    console.log('🎉 Salary component seeding completed!');
  }
}
