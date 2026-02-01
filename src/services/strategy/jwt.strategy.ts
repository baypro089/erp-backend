import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import Redis from 'ioredis';
import { Strategy, ExtractJwt } from "passport-jwt";
import type { Request } from "express";
import { UserStatus } from "@libs/shared/enums/user-status.enum";
import { UsersService } from "../user.service";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.access_token,
      ]),
      secretOrKey: config.get('JWT_ACCESS_TOKEN_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    // 1️⃣ Check blacklist (nhanh hơn, không cần query DB)
    const isBanned = await this.redisService.get(`banned:${payload.sub}`);
    if (isBanned) {
      throw new UnauthorizedException('Account has been banned');
    }

    // 2️⃣ Load user từ DB
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3️⃣ Check isActive
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 4️⃣ Check banned status (double-check từ DB)
    if (user.status === UserStatus.BANNED) {
      // Set blacklist nếu chưa có (failsafe)
      await this.redisService.set(`banned:${user.id}`, 'true', 86400);
      throw new UnauthorizedException('Account has been banned');
    }

    // 5️⃣ Gán user thật vào request
    return {
      id: user.id,
      role: user.role.role_code,
    };
  }

}
