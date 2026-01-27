import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import Redis from 'ioredis';
import { Strategy, ExtractJwt } from "passport-jwt";
import type { Request } from "express";
import { UserStatus } from "@libs/shared/enums/user-status.enum";
import { UsersService } from "../user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.access_token,
      ]),
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    // 1️⃣ Check session Redis
    const tokenInRedis = await this.redis.get(
      `session:${payload.sub}`,
    );

    if (!tokenInRedis) {
      throw new UnauthorizedException('Session expired');
    }

    // 2️⃣ Load user từ DB
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3️⃣ Check banned
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Account has been banned');
    }

    // 4️⃣ Gán user thật vào request
    return {
      id: user.id,
      role: user.role.role_code,
    };
  }

}
