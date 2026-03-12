import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { SeedModule } from './seed.module';
import { SalaryComponentSeeder } from './salary-component.seed';
import { SystemSettingSeeder } from './system-setting.seed';
import { PermissionSeeder } from './permission.seed';
import { DataSeeder } from './data.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🌱 Starting database seeding...\n');

    // Get seeders
    const permissionSeeder = app.select(SeedModule).get(PermissionSeeder);
    const salaryComponentSeeder = app.select(SeedModule).get(SalaryComponentSeeder);
    const systemSettingSeeder = app.select(SeedModule).get(SystemSettingSeeder);
    const dataSeeder = app.select(SeedModule).get(DataSeeder);

    // Run seeders in order
    console.log('🔐 Seeding permissions...');
    await permissionSeeder.seed();
    console.log('');

    console.log('📦 Seeding salary components...');
    await salaryComponentSeeder.seed();
    console.log('');

    console.log('⚙️  Seeding system settings...');
    await systemSettingSeeder.seed();
    console.log('');

    console.log('📊 Seeding demo data...');
    await dataSeeder.seed();
    console.log('');

    console.log('✨ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
