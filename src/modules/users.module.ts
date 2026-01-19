import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '@/controllers/user.controller'; // Import từ Layer Controller
import { UsersService } from '@/services/user.service';         // Import từ Layer Service
import { User } from '../entities/user.entity';                   // Import từ Layer Entity
import { Role } from '../entities/role.entity';
import { RoleRepository } from '@/repositories/role.repository';

import { Employee } from '@/entities/employee.entity';
import { UserRepository } from '@/repositories/user.repository';

@Module({
  imports: [
    // Đăng ký Entity User vào Repository cho module này
    TypeOrmModule.forFeature([User, Role, Employee]), 
  ],
  controllers: [UsersController],
  providers: [UsersService, RoleRepository, UserRepository],
  exports: [UsersService], // Export nếu các module khác (như Auth) cần dùng
})
export class UsersModule {}