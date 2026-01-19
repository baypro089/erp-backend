import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/services/user.service';
import { User } from '@/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      role: user.role.role_code,
    };

    const accessToken = this.jwtService.sign(payload);

    // Lưu session vào Redis
    await this.redis.set(
      `session:${user.id}`,
      accessToken,
      'EX',
      60 * 15,
    );

    return { accessToken };
  }

  async logout(userId: string) {
    await this.redis.del(`session:${userId}`);
  }
  
}
