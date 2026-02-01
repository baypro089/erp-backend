import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '@/controllers/user.controller';
import { UsersService } from '@/services/user.service';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { RoleRepository } from '@/repositories/role.repository';
import { Employee } from '@/entities/employee.entity';
import { UserRepository } from '@/repositories/user.repository';
import { RedisService } from '@/services/redis.service';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { MailService } from '@/services/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), 
  ],
  controllers: [UsersController],
  providers: [UsersService, RoleRepository, UserRepository, EmployeeRepository, MailService],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}