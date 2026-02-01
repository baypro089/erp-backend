import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/services/user.service';
import { User } from '@/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { UserStatus } from '@libs/shared/enums/user-status.enum';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '@libs/shared/types/login.type';
import type { Response, Request } from "express";
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
    private config: ConfigService,
    private mailService: MailService,
  ) { }

  /* ================= LOGIN ================= */

  async login(dto: LoginDto) {
    try {
      const user = await this.usersService.findByUsername(
        dto.username,
      );

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(
        dto.password,
        user.password,
      );

      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      await this.saveRefreshToken(user.id, refreshToken);
      await this.usersService.updateUser(user.id, { lastLogin: new Date() });

      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed. Please try again');
    }
  }

  /* ================= REFRESH ================= */

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      let payload: any;

      try {
        payload = this.jwtService.verify(refreshToken, {
          secret: this.config.get(
            'JWT_REFRESH_TOKEN_SECRET',
          ),
        });
      } catch {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const savedToken = await this.redisService.get(
        `refresh_token:${payload.sub}`,
      );

      if (!savedToken || savedToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token revoked');
      }

      const user = await this.usersService.findById(
        payload.sub,
      );

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User invalid');
      }

      return this.generateAccessToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /* ================= LOGOUT ================= */

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.decode(
        refreshToken,
      ) as any;

      if (payload?.sub) {
        await this.redisService.del(
          `refresh_token:${payload.sub}`,
        );
      }
    } catch (error) {
      // Silent fail - logout should always succeed from user perspective
      console.error('Logout error:', error);
    }
  }


  /* ================= TOKEN HELPERS ================= */

  private generateAccessToken(user: any): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        role: user.role.role_code,
      },
      {
        secret: this.config.get(
          'JWT_ACCESS_TOKEN_SECRET',
        ),
        expiresIn: this.config.get(
          'JWT_ACCESS_TOKEN_EXPIRATION',
        ),
      },
    );
  }

  private generateRefreshToken(user: any): string {
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get(
          'JWT_REFRESH_TOKEN_SECRET',
        ),
        expiresIn: this.config.get(
          'JWT_REFRESH_TOKEN_EXPIRATION',
        ),
      },
    );
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ) {
    try {
      const ttl = 7 * 24 * 60 * 60; // 7 days
      await this.redisService.set(
        `refresh_token:${userId}`,
        refreshToken,
        ttl,
      );
    } catch (error) {
      console.error('Failed to save refresh token:', error);
      throw new Error('Failed to save session');
    }
  }

  /* ================= COOKIE HELPERS ================= */

  setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    this.setAccessCookie(res, tokens.accessToken);
    this.setRefreshCookie(res, tokens.refreshToken);
  }

  setAccessCookie(res: Response, token: string) {
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 15 * 60 * 1000,
    });
  }

  setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  /** =========SEND OTP EMAIL============ */
  async sendForgotPasswordOtp(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await this.redisService.set(
        `otp:forgot:${email}`,
        JSON.stringify({ otp, attempts: 0 }),
        300,
      );

      await this.mailService.sendOtpEmail(email, otp);

      return { message: 'OTP sent to email' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Failed to send OTP:', error);
      throw new BadRequestException('Failed to send OTP. Please try again later');
    }
  }

  async verifyOtp(email: string, otp: string) {
    try {
      const key = `otp:forgot:${email}`;
      const data = await this.redisService.get(key);

      if (!data) {
        throw new BadRequestException('OTP expired or invalid');
      }

      const parsed: { otp: string; attempts: number } = JSON.parse(data as string);

      // Check max attempts (0,1,2,3,4 = 5 lần)
      if (parsed.attempts >= 5) {
        await this.redisService.del(key);
        throw new ForbiddenException('Too many attempts. Please request a new OTP');
      }

      // Verify OTP
      if (parsed.otp !== otp) {
        parsed.attempts++;
        // ⚠️ KHÔNG reset TTL - giữ nguyên thời gian hết hạn
        const ttl = await this.redisService.ttl(key);
        await this.redisService.set(key, JSON.stringify(parsed), ttl > 0 ? ttl : 300);

        throw new BadRequestException('Invalid OTP. Please try again');
      }

      // ✅ XÓA OTP sau khi verify thành công
      await this.redisService.del(key);

      return { message: 'OTP verified successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('OTP verification error:', error);
      throw new BadRequestException('OTP verification failed. Please try again');
    }
  }

  /**
   * ================= RESET PASSWORD =================
   */

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ) {
    try {
      await this.verifyOtp(email, otp);

      await this.usersService.updatePasswordByEmail(email, newPassword);
      await this.redisService.del(`otp:forgot:${email}`);

      return { message: 'Password updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Password reset error:', error);
      throw new BadRequestException('Failed to reset password. Please try again');
    }
  }


}


