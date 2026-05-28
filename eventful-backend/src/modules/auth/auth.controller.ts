import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
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
}
