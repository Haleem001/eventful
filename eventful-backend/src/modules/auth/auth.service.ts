// src/modules/auth/auth.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(
        'Registration request could not be processed.',
      );
    }

    // Hash the password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create and save the new user record
    const newUser = this.userRepository.create({
      email,
      passwordHash,
      role, // Will fall back to EVENTEE automatically via TypeORM if undefined
    });

    const savedUser = await this.userRepository.save(newUser);

    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }
}