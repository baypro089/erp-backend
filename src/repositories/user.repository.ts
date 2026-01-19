import { User } from "@/entities/user.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

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

  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.create(userData);
    return await this.save(user);
  }

}