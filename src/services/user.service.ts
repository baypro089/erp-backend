import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { RoleRepository } from '@/repositories/role.repository';
import { UserRepository } from '@/repositories/user.repository';
import { RedisService } from './redis.service';
import { createHash } from 'crypto';
import { PagedResult } from '@libs/shared/types/pagedResult.type';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly roleRepository: RoleRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly dataSource: DataSource, // Inject DataSource
  ) { }

  async getAllUsers(): Promise<User[]> {
    const cacheKey = 'all_users';
    const cachedUsers: User[] | undefined | null = await this.redisService.get(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }
    const users = await this.usersRepository.findAllActiveUsers();
    await this.redisService.set(cacheKey, users, 300); // Cache for 5 minutes
    return users;
  }

  async getAllUsersOptional(
    userId?: string,
    username?: string,
    email?: string,
    roleId?: string,
    employeeName?: string,
    createDateFrom?: Date,
    createDateTo?: Date,
    page?: number,
    pageSize?: number,
  ): Promise<PagedResult<User>> {
    const rawKey = JSON.stringify({
      userId,
      username,
      email,
      roleId,
      employeeName,
      createDateFrom,
      createDateTo,
      page: page || 1,
      pageSize: pageSize || 10,
    });

    const cacheKey = `users:${createHash('md5').update(rawKey).digest('hex')}`;
    const cachedResult = await this.redisService.get<PagedResult<User>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = await this.usersRepository.findAllUsersOptional(
      userId,
      username,
      email,
      roleId,
      employeeName,
      createDateFrom,
      createDateTo,
      page,
      pageSize,
    );
    await this.redisService.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return await this.dataSource.transaction(async (manager) => {

      const usersRepo = manager.withRepository(this.usersRepository);
      const roleRepo = manager.withRepository(this.roleRepository);
      const employeeRepo = manager.withRepository(this.employeeRepository);

      const hashedPassword = await bcrypt.hash(userData.password as string, 10);

      const role = await roleRepo.findByCode(userData.roleCode as string);
      if (!role) {
        throw new Error(`Role not found: ${userData.roleCode}`);
      }

      const employee = await employeeRepo.findByCode(userData.username as string);
      if (!employee) {
        throw new Error(`Employee not found for username: ${userData.username}. Username must match employee code`);
      }

      const userExists = await usersRepo.findByUsername(userData.username as string);
      if (userExists) {
        throw new Error(`User with username ${userData.username} already exists`);
      }

      const emailExists = await usersRepo.findByEmail(userData.email as string);
      if (emailExists) {
        throw new Error(`User with email ${userData.email} already exists`);
      }

      const newUser = await usersRepo.createUser({
        ...userData,
        password: hashedPassword,
        role: role,
      });

      if (newUser) {
        await employeeRepo.updateEmployee(employee.id, { user: newUser });

      }

      await this.redisService.delByPrefix('users:'); // Invalidate related caches
      await this.redisService.del('all_users'); // Invalidate all users cache
      await this.redisService.delByPrefix('employees:'); // Invalidate related employee caches
      await this.redisService.del('all_employees'); // Invalidate all employees cache
      
      return newUser;
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const updateData: Partial<User> = { ...userData };
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    const updatedUser = await this.usersRepository.updateUser(id, updateData);
    await this.redisService.delByPrefix('users:'); // Invalidate related caches
    await this.redisService.del('all_users'); // Invalidate all users cache
    return updatedUser;
  }

  async toggleUserActiveStatus(id: string): Promise<void> {
    await this.usersRepository.toggleUserActiveStatus(id);
    await this.redisService.delByPrefix('users:'); // Invalidate related caches
    await this.redisService.del('all_users'); // Invalidate all users cache
  }

  async banUser(userId: string): Promise<void> {
    await this.usersRepository.banUser(userId);
    await this.redisService.del(`session:${userId}`); // Invalidate user session cache
  }
}