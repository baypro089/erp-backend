import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '@/configurations/database.config';
import { UsersModule } from './modules/users.module';
import { RolesModule } from './modules/roles.module';
import { EmployeesModule } from './modules/employees.module';
import { AuthModule } from './modules/auth.module';
import { RedisModule } from './modules/redis.module';
import { FileModule } from './modules/file.module';
import { DepartmentsModule } from './modules/departments.module';
import { PositionsModule } from './modules/positions.module';
import { JobHistoryModule } from './modules/job-history.module';
import { LeaveRequestModule } from './modules/leave-request.module';
import { PayslipModule } from './modules/payslip.module';
import { HolidayModule } from './modules/holiday.module';
import { ResignationRequestModule } from './modules/resignation-request.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemSettingModule } from './modules/system-setting.module';
import { SeedModule } from './seeds/seed.module';
import { TasksModule } from './modules/tasks.module';
import { BrandModule } from './modules/brand.module';
import { SupplierModule } from './modules/supplier.module';
import { ProductModule } from './modules/product.module';
import { CategoryModule } from './modules/category.module';
import { WarehouseModule } from './modules/warehouse.module';
import { ProductStockModule } from './modules/product-stock.module';
import { ProductSerialModule } from './modules/product-serial.module';
import { ImportReceiptModule } from './modules/import-receipt.module';
import { CustomerModule } from './modules/customer.module';
import { ReturnRequestModule } from './modules/return-request.module';
import { OrderModule } from './modules/order.module';
import { AttachmentModule } from './modules/attachment.module';
import { AdminStatisticModule } from './modules/admin-statistic.module';
import { HrStatisticModule } from './modules/hr-statistic.module';
import { HrReportModule } from './modules/hr-report.module';
import { SalesStatisticModule } from './modules/sales-statistic.module';
import { WarehouseReportModule } from './modules/warehouse-report.module';
import { CacheModule } from './modules/cache.module';
import { JwtAuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/roles.guard';

@Module({
  imports: [

    UsersModule, 
    RolesModule,
    EmployeesModule,
    AuthModule,
    RedisModule,
    FileModule,
    AttachmentModule,
    DepartmentsModule,
    PositionsModule,
    JobHistoryModule,
    LeaveRequestModule,
    PayslipModule,
    HolidayModule,
    ResignationRequestModule,
    SystemSettingModule,
    SeedModule,
    TasksModule,
    BrandModule,
    SupplierModule,
    CategoryModule,
    ProductModule,
    WarehouseModule,
    ProductStockModule,
    ProductSerialModule,
    ImportReceiptModule,
    CustomerModule,
    OrderModule,
    ReturnRequestModule,
    AdminStatisticModule,
    HrStatisticModule,
    HrReportModule,
    SalesStatisticModule,
    WarehouseReportModule,
    CacheModule,

    ConfigModule.forRoot({
      isGlobal: true, 
      load: [databaseConfig],
    }),

    ScheduleModule.forRoot(),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),

  ],
  controllers: [],
  providers: [
    // ─── Global Guards ───────────────────────────────────────────────────────
    // JwtAuthGuard chạy trước, xác thực JWT token cho tất cả các route (trừ @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // PermissionsGuard chạy sau JwtAuthGuard và kiểm tra quyền hạn của người dùng
    // dựa trên decorator @RequirePermissions() khai báo trên route/controller.
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}