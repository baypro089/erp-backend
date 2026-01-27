import { Module } from '@nestjs/common';
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

@Module({
  imports: [

    UsersModule, 
    RolesModule,
    EmployeesModule,
    AuthModule,
    RedisModule,
    FileModule,
    DepartmentsModule,
    PositionsModule,

    ConfigModule.forRoot({
      isGlobal: true, 
      load: [databaseConfig],
    }),

    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}