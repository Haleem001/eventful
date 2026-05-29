import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';

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
}
