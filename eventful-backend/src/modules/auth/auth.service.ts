import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, role, name } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(
        'Registration request could not be processed.',
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = await bcrypt.hash(verificationToken, saltRounds);

    const newUser = this.userRepository.create({
      email,
      passwordHash,
      role,
      name,
      verificationToken: verificationTokenHash,
    });

    const savedUser = await this.userRepository.save(newUser);

    try {
      await this.notificationsService.sendVerificationEmail(email, verificationToken);
    } catch (err) {
      this.logger.warn(`Verification email not sent to ${email}: ${err}`);
    }

    const { passwordHash: _, verificationToken: __, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async verifyEmail(token: string, email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid verification request.');
    }
    if (user.isVerified) {
      return { message: 'Email already verified.' };
    }
    if (!user.verificationToken) {
      throw new BadRequestException('No verification pending.');
    }
    const isValid = await bcrypt.compare(token, user.verificationToken);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired verification token.');
    }
    user.isVerified = true;
    user.verificationToken = undefined as any;
    await this.userRepository.save(user);
    return { message: 'Email verified successfully.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = resetTokenExpiry;
    await this.userRepository.save(user);

    try {
      await this.notificationsService.sendPasswordResetEmail(email, resetToken);
    } catch (err) {
      this.logger.warn(`Password reset email not sent to ${email}: ${err}`);
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const candidates = await this.userRepository.find({
      where: { resetTokenExpiry: MoreThan(new Date()) },
    });
    let targetUser: User | null = null;

    for (const u of candidates) {
      if (!u.resetToken) continue;
      const isValid = await bcrypt.compare(token, u.resetToken);
      if (isValid) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const saltRounds = 10;
    targetUser.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    targetUser.resetToken = undefined as any;
    targetUser.resetTokenExpiry = undefined as any;
    await this.userRepository.save(targetUser);

    return { message: 'Password reset successfully.' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'passwordHash'> }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = this.jwtService.sign(payload);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { accessToken, user: userWithoutPassword };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { message: 'If that email exists, a verification link has been sent.' };
    }
    if (user.isVerified) {
      return { message: 'Email already verified.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = await bcrypt.hash(verificationToken, 10);
    user.verificationToken = verificationTokenHash;
    await this.userRepository.save(user);

    try {
      await this.notificationsService.sendVerificationEmail(email, verificationToken);
    } catch (err) {
      this.logger.warn(`Verification email not sent to ${email}: ${err}`);
    }

    return { message: 'If that email exists, a verification link has been sent.' };
  }

  async validateGoogleUser(profile: any): Promise<User> {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;
    const googleName = displayName || email.split('@')[0];

    let user = await this.userRepository.findOne({ where: { googleId: id } });
    if (user) return user;

    user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      user.googleId = id;
      user.authProvider = 'google';
      user.name = user.name || googleName;
      user.avatarUrl = photos?.[0]?.value;
      if (!user.isVerified) user.isVerified = true;
      return this.userRepository.save(user);
    }

    const newUser = this.userRepository.create({
      email,
      name: googleName,
      googleId: id,
      authProvider: 'google',
      isVerified: true,
      avatarUrl: photos?.[0]?.value,
    });
    return this.userRepository.save(newUser);
  }

  async googleLogin(user: User): Promise<{ accessToken: string; user: Omit<User, 'passwordHash'> }> {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = this.jwtService.sign(payload);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { accessToken, user: userWithoutPassword };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Cannot change password for Google-authenticated accounts.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully.' };
  }
}
