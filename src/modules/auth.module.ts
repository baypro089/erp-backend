import { PassportModule } from "@nestjs/passport";
import { Module } from "@nestjs/common";
import { UsersModule } from "./users.module";
import { RedisModule } from "./redis.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "@/services/auth.service";
import { AuthController } from "@/controllers/auth.controller";
import { JwtStrategy } from "@/services/strategy/jwt.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') as any || '15m' },
      }),
    }),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
