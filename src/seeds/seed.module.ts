import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryComponent } from '@/entities/salary-component';
import { SystemSetting } from '@/entities/system-setting';
import { SalaryComponentSeeder } from './salary-component.seed';
import { SystemSettingSeeder } from './system-setting.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryComponent,
      SystemSetting,
    ]),
  ],
  providers: [
    SalaryComponentSeeder,
    SystemSettingSeeder,
  ],
  exports: [
    SalaryComponentSeeder,
    SystemSettingSeeder,
  ],
})
export class SeedModule {}
