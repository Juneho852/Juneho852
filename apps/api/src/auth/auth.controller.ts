import { Controller, Post, Body, UseGuards, Get, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.authService.verifyMfa(dto.userId, dto.token);
  }

  @Get('mfa/setup')
  setupMfa(@CurrentUser() user: any) {
    return this.authService.setupMfa(user.userId);
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  enableMfa(@CurrentUser() user: any, @Body() dto: MfaVerifyDto) {
    return this.authService.enableMfa(user.userId, dto.token);
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return user;
  }
}
