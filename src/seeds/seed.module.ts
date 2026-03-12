import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryComponent } from '@/entities/salary-component';
import { SystemSetting } from '@/entities/system-setting';
import { Permission } from '@/entities/permission.entity';
import { SalaryComponentSeeder } from './salary-component.seed';
import { SystemSettingSeeder } from './system-setting.seed';
import { PermissionSeeder } from './permission.seed';
import { DataSeeder } from './data.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryComponent,
      SystemSetting,
      Permission,
    ]),
  ],
  providers: [
    SalaryComponentSeeder,
    SystemSettingSeeder,
    PermissionSeeder,
    DataSeeder,
  ],
  exports: [
    SalaryComponentSeeder,
    SystemSettingSeeder,
    PermissionSeeder,
    DataSeeder,
  ],
})
export class SeedModule implements OnModuleInit {
  private readonly logger = new Logger(SeedModule.name);

  constructor(
    private readonly permissionSeeder: PermissionSeeder,
    private readonly salaryComponentSeeder: SalaryComponentSeeder,
    private readonly systemSettingSeeder: SystemSettingSeeder,
    private readonly dataSeeder: DataSeeder,
  ) {}

  async onModuleInit() {
    this.logger.log('🌱 Running startup seeders...');

    try {
      this.logger.log('🔐 Seeding permissions...');
      await this.permissionSeeder.seed();

      this.logger.log('📦 Seeding salary components...');
      await this.salaryComponentSeeder.seed();

      this.logger.log('⚙️  Seeding system settings...');
      await this.systemSettingSeeder.seed();

      this.logger.log('📊 Seeding demo data...');
      await this.dataSeeder.seed();

      this.logger.log('✨ All startup seeders completed!');
    } catch (error) {
      this.logger.error('❌ Startup seeding failed:', error);
    }
  }
}
