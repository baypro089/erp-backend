import { Injectable, NotFoundException } from '@nestjs/common';
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
import { MailService } from './mail.service';
import { Role } from '@/entities/role.entity';
import { Employee } from '@/entities/employee.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly roleRepository: RoleRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly dataSource: DataSource, // Inject DataSource
    private readonly mailService: MailService,
  ) {}

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

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return await this.dataSource.transaction(async (manager) => {

      const usersRepo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);
      const employeeRepo = manager.getRepository(Employee);

      const hashedPassword = await bcrypt.hash(userData.password as string, Number(process.env.BCRYPT_SALT_OR_ROUNDS));

      const role = await roleRepo.findOne({ where: { role_code: userData.roleCode as string } });
      if (!role) {
        throw new Error(`Role not found: ${userData.roleCode}`);
      }

      const employee = await employeeRepo.findOne({ where: { employeeCode: userData.username as string } });
      if (!employee) {
        throw new Error(`Employee not found for username: ${userData.username}. Username must match employee code`);
      }

      const userExists = await usersRepo.findOne({ where: { username: userData.username as string } });
      if (userExists) {
        throw new Error(`User with username ${userData.username} already exists`);
      }

      const emailExists = await usersRepo.findOne({ where: { email: userData.email as string } });
      if (emailExists) {
        throw new Error(`User with email ${userData.email} already exists`);
      }

      const newUser = await usersRepo.save(usersRepo.create({
        ...userData,
        password: hashedPassword,
        role: role,
      }));

      if (newUser) {
        await employeeRepo.update(employee.id, { user: newUser });
        // Send welcome email
        await this.mailService.sendWelcomeEmail(newUser.email, newUser.username, employee.fullName);
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
      throw new Error('Use updatePasswordByEmail to update password');
    }
    const updatedUser = await this.usersRepository.updateUser(id, updateData);
    await this.redisService.delByPrefix('users:'); // Invalidate related caches
    await this.redisService.del('all_users'); // Invalidate all users cache
    return updatedUser;
  }

  async updatePasswordByEmail(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT_OR_ROUNDS));
    await this.usersRepository.updatePasswordByEmail(email, hashedPassword);
    await this.redisService.delByPrefix('users:'); // Invalidate related caches
    await this.redisService.del('all_users'); // Invalidate all users cache
  }

  async toggleUserActiveStatus(id: string): Promise<void> {
    await this.usersRepository.toggleUserActiveStatus(id);
    await this.redisService.delByPrefix('users:'); // Invalidate related caches
    await this.redisService.del('all_users'); // Invalidate all users cache
  }

  async banUser(userId: string): Promise<void> {
    await this.usersRepository.banUser(userId);
    
    // Revoke refresh token to prevent token refresh
    await this.redisService.del(`refresh_token:${userId}`);
    
    // Blacklist user to block all requests immediately (even with valid access token)
    await this.redisService.set(`banned:${userId}`, 'true', 86400); // 24 hours
  }
}