import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import Redis from 'ioredis';
import { Strategy, ExtractJwt } from "passport-jwt";
import type { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.access_token,
      ]),
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    const tokenInRedis = await this.redis.get(`session:${payload.sub}`);

    if (!tokenInRedis) {
      throw new UnauthorizedException('Session expired');
    }

    return payload; // gán vào req.user
  }
}
