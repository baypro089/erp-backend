import { User } from "@/entities/user.entity";
import { UserStatus } from "@libs/shared/enums/user-status.enum";
import { PagedResult } from "@libs/shared/types/pagedResult.type";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository, SelectQueryBuilder } from "typeorm";

@Injectable()
export class UserRepository extends Repository<User> {
  // Define your custom methods for user data access here
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({
      where: { username, isActive: true },
      relations: ['role'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email, isActive: true }, relations: ['role'] });
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne({ where: { id, isActive: true }, relations: ['role'] });
  }

  async findAllActiveUsers(): Promise<User[]> {
    return this.find({ where: { isActive: true }, relations: ['role'] });
  }

  /** Lỡ viết rồi nên để trưng thôi */
  async findAllUsersOptional(
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
    const query : SelectQueryBuilder<User> = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role',)
      .leftJoinAndSelect('user.employee', 'employee')
      .where('user.employee IS NOT NULL')
      .andWhere('user.role IS NOT NULL');

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }
    if (username) {
      query.andWhere('user.username ILIKE :username', { username: `%${username}%` });
    }
    if (email) {
      query.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }
    if (roleId) {
      query.andWhere('user.role_code = :roleId', { roleId });
    }
    if (employeeName) {
      query.andWhere('unaccent(employee.employee_name) ILIKE unaccent(:employeeName)', { employeeName: `%${employeeName}%` });
    }
    if (createDateFrom) {
      query.andWhere('DATE(user.created_at) >= :createDateFrom', { createDateFrom });
    }
    if (createDateTo) {
      query.andWhere('DATE(user.created_at) <= :createDateTo', { createDateTo });
    }

    if (page && pageSize) {
      query.orderBy('user.created_at', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    }

    const [items, totalItems] = await query.getManyAndCount();

    return {
      items,
      totalCount: totalItems,
      page: page || 1,
      pageSize: pageSize || totalItems,
      totalPages: pageSize ? Math.ceil(totalItems / pageSize) : 1,
      hasPreviousPage: page ? page > 1 : false,
      hasNextPage: pageSize ? (page || 1) * pageSize < totalItems : false,
    };
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const newUser = await this.save(this.create(userData));
    return newUser;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.update(id, updateData);
    return this.findById(id);
  }

  async toggleUserActiveStatus(id: string): Promise<void> {
    const user = await this.findOne({ where: { id }, relations: ['role'] });
    const active = user?.isActive;
    await this.update(id, { isActive: !active });
  }


  async banUser(id: string): Promise<void> {
    await this.update(id, { status: UserStatus.BANNED });
  }
}