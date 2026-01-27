import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/services/user.service';
import { User } from '@/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { UserStatus } from '@libs/shared/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
  ) { }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('User has been banned');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateUser(user.id, { lastLogin: new Date() });

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      role: user.role.role_code,
    };

    const accessToken = this.jwtService.sign(payload);

    const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRATION || '900s';
    const ttl = parseInt(expiresIn.replace('s', ''), 10);

    // Lưu session vào Redis
    await this.redisService.set(
      `session:${user.id}`,
      accessToken,
      ttl,
    );

    return { accessToken };
  }

  async logout(userId: string) {
    await this.redisService.del(`session:${userId}`);
  }

}
