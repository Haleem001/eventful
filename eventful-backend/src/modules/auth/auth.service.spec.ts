import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed_password',
    role: Role.EVENTEE,
    isVerified: true,
    verificationToken: 'hashed_verification_token',
    resetToken: 'hashed_reset_token',
    resetTokenExpiry: new Date(Date.now() + 3600000),
    events: [],
    createdAt: new Date('2026-01-01'),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt_token_xyz'),
  };

  const mockNotificationsService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register a new user and omit passwordHash', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'secret123',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe(Role.EVENTEE);
      expect(mockNotificationsService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'secret123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not throw when verification email fails to send', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockNotificationsService.sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await service.register({
        email: 'test@example.com',
        password: 'secret123',
      });

      expect(result.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should return accessToken and user on valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const verifiedUser = { ...mockUser, isVerified: true };
      mockUserRepository.findOne.mockResolvedValue(verifiedUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'secret123',
      });

      expect(result.accessToken).toBe('jwt_token_xyz');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      const unverifiedUser = { ...mockUser, isVerified: false };
      mockUserRepository.findOne.mockResolvedValue(unverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'secret123' }),
      ).rejects.toThrow('Please verify your email before logging in.');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isVerified: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, isVerified: true });

      const result = await service.verifyEmail('valid-token', 'test@example.com');

      expect(result.message).toBe('Email verified successfully.');
    });

    it('should return already verified when already verified', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isVerified: true });

      const result = await service.verifyEmail('token', 'test@example.com');

      expect(result.message).toBe('Email already verified.');
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isVerified: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.verifyEmail('wrong-token', 'test@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no verification pending', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser, isVerified: false, verificationToken: undefined as any,
      });

      await expect(
        service.verifyEmail('token', 'test@example.com'),
      ).rejects.toThrow('No verification pending.');
    });

    it('should throw BadRequestException for unknown email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyEmail('token', 'unknown@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email for unverified user', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isVerified: false });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');
      mockUserRepository.save.mockResolvedValue({});

      const result = await service.resendVerification('test@example.com');

      expect(result.message).toContain('verification link');
      expect(mockNotificationsService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should return already verified if user is verified', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isVerified: true });

      const result = await service.resendVerification('test@example.com');

      expect(result.message).toBe('Email already verified.');
      expect(mockNotificationsService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return generic message for unknown email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.resendVerification('unknown@example.com');

      expect(result.message).toContain('verification link');
      expect(mockNotificationsService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should generate and email reset token', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_reset');
      mockUserRepository.save.mockResolvedValue({});

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('reset link');
      expect(mockNotificationsService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should return generic message for unknown email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@example.com');

      expect(result.message).toContain('reset link');
      expect(mockNotificationsService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockUserRepository.find.mockResolvedValue([mockUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.save.mockResolvedValue({});

      const result = await service.resetPassword('valid-token', 'newPassword123');

      expect(result.message).toBe('Password reset successfully.');
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockUserRepository.find.mockResolvedValue([mockUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.resetPassword('wrong-token', 'newPassword123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      const expiredUser = { ...mockUser, resetTokenExpiry: new Date(Date.now() - 3600000) };
      mockUserRepository.find.mockResolvedValue([expiredUser]);

      await expect(
        service.resetPassword('token', 'newPassword123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      mockUserRepository.save.mockResolvedValue({});

      const result = await service.changePassword('test-user-id', {
        currentPassword: 'oldPass123',
        newPassword: 'newPass123',
      });

      expect(result.message).toBe('Password changed successfully.');
    });

    it('should throw BadRequestException when current password is wrong', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('test-user-id', {
          currentPassword: 'wrongPass',
          newPassword: 'newPass123',
        }),
      ).rejects.toThrow('Current password is incorrect.');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('bad-id', {
          currentPassword: 'oldPass123',
          newPassword: 'newPass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
