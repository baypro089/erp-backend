import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/users.dto';
import { RoleRepository } from '@/repositories/role.repository';
import { UserRepository } from '@/repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  // //Seeding: Tự động tạo Admin nếu chưa có
  // async onModuleInit() {
  //   const adminExists = await this.usersRepository.findOneBy({ username: 'admin' });
  //   if (!adminExists) {
  //     const adminRole = await this.roleRepository.findByCode('ADMIN');
  //     if (!adminRole) {
  //       throw new Error('Admin role not found. Please seed roles before seeding admin user.');
  //     }
  //     const password = await bcrypt.hash('admin123', 10);
  //     const admin = this.usersRepository.create({
  //       username: 'admin',
  //       email: 'admin@erp.com',
  //       password,
  //       role: adminRole
  //     });
  //     await this.usersRepository.save(admin);
  //     console.log('>>> SEEDED DEFAULT ADMIN USER');
  //   }
  // }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

}