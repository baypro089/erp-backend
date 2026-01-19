import { JwtAuthGuard } from "@/guards/auth.guard";
import { AuthService } from "@/services/auth.service";
import { Controller, Post, Body, Res, UnauthorizedException, Req, UseGuards, Get } from "@nestjs/common";
import type { Response, Request } from "express";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken } = await this.authService.login(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false, // true nếu dùng HTTPS
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    return {
      message: 'Login success',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;
    await this.authService.logout(user.sub);

    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }
  
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req) {
    return req.user;
  }

}


