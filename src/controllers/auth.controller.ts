import { JwtAuthGuard } from "@/guards/auth.guard";
import { AuthService } from "@/services/auth.service";
import { Controller, Post, Body, Res, UnauthorizedException, Req, UseGuards, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import type { Response, Request } from "express";
import { LoginDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto } from '@/dtos/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) { }

  @Post('login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user and set access_token and refresh_token cookies'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: { message: 'Login successful' }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(dto);

    this.authService.setAuthCookies(res, {
      accessToken,
      refreshToken,
    });

    return { message: 'Login successful' };
  }

  @Post('logout')
  @ApiOperation({ 
    summary: 'User logout',
    description: 'Clear authentication cookies and invalidate refresh token'
  })
  @ApiCookieAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Logged out successfully',
    schema: {
      example: { message: 'Logged out' }
    }
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Logged out' };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get current user',
    description: 'Get authenticated user information'
  })
  @ApiCookieAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'User information retrieved',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'admin'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async me(@Req() req) {
    return req.user;
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token from cookie'
  })
  @ApiCookieAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      example: { message: 'Token refreshed' }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid or expired refresh token',
    schema: {
      example: {
        statusCode: 401,
        message: 'No refresh token',
        error: 'Unauthorized'
      }
    }
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const newAccessToken =
      await this.authService.refreshAccessToken(refreshToken);

    this.authService.setAccessCookie(res, newAccessToken);

    return { message: 'Token refreshed' };
  }

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Request password reset OTP',
    description: 'Send OTP code to user email for password reset (expires in 5 minutes)'
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP sent successfully',
    schema: {
      example: { message: 'OTP sent to email' }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.sendForgotPasswordOtp(dto.email);
  }

  @Post('verify-otp')
  @ApiOperation({ 
    summary: 'Verify OTP code',
    description: 'Verify the OTP code sent to email (maximum 5 attempts)'
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP verified successfully',
    schema: {
      example: { message: 'OTP verified successfully' }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid OTP or OTP expired',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid OTP. Please try again',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Too many attempts',
    schema: {
      example: {
        statusCode: 403,
        message: 'Too many failed attempts. Please request a new OTP',
        error: 'Forbidden'
      }
    }
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Reset password',
    description: 'Reset user password with verified OTP code'
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully',
    schema: {
      example: { message: 'Password updated successfully' }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid OTP',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid OTP. Please try again',
        error: 'Bad Request'
      }
    }
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

}



