import { Body, Controller, HttpCode, HttpStatus, Post, Get, Delete, Query, UseGuards, Req, Res, ParseEnumPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { User } from './entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Role } from './enums/role.enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Register a new creator or eventee account' })
  @ApiCreatedResponse({
    description: 'Registration successful.',
    schema: {
      example: {
        id: 'd3b07384-d113-4c4e-9c8e-cf0415aa7df7',
        email: 'user@example.com',
        role: 'EVENTEE',
        createdAt: '2026-05-29T00:15:30.000Z',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Registration request could not be processed.',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'Login successful.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 'd3b07384-d113-4c4e-9c8e-cf0415aa7df7',
          email: 'user@example.com',
          role: 'EVENTEE',
          createdAt: '2026-05-29T00:15:30.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'passwordHash'> }> {
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  @ApiOkResponse({ description: 'Email verified successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid or expired token.' })
  @ApiQuery({ name: 'token', required: true })
  @ApiQuery({ name: 'email', required: true })
  async verifyEmail(
    @Query('token') token: string,
    @Query('email') email: string,
  ) {
    return this.authService.verifyEmail(token, email);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiOkResponse({ description: 'Verification link sent if email exists.' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiOkResponse({ description: 'Reset link sent if email exists.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiOkResponse({ description: 'Password reset successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid or expired token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const { user: googleUser, isNewUser } = req.user;
    const result = await this.authService.googleLogin(googleUser);
    const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${result.accessToken}&isNewUser=${isNewUser}`,
    );
  }

  @Post('choose-role')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set role for new Google-authenticated users' })
  async chooseRole(
    @Body('role', new ParseEnumPipe(Role)) role: Role,
    @Req() req: any,
  ) {
    return this.authService.chooseRole(req.user.id, role);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete authenticated user account (soft delete)' })
  async deleteAccount(@Req() req: any) {
    return this.authService.deleteAccount(req.user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiOkResponse({ description: 'Password changed successfully.' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: any,
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
