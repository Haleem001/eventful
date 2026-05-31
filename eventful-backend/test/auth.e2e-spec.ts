import * as supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';

const request = (supertest as any).default || supertest;

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  beforeAll(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    } as any;

    const moduleFixture = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /auth/register', () => {
    it('should register a new user (201)', async () => {
      authService.register.mockResolvedValue({
        id: 'new-id',
        email: 'new@test.com',
        role: 'EVENTEE',
        createdAt: new Date('2026-01-01'),
      } as any);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@test.com', password: 'password123' })
        .expect(201);

      expect(res.body.email).toBe('new@test.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate email (409)', async () => {
      authService.register.mockRejectedValue(
        new (require('@nestjs/common').ConflictException)('Registration request could not be processed.'),
      );

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'existing@test.com', password: 'password123' })
        .expect(409);
    });

    it('should reject invalid email (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should reject short password (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'short' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials (200)', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'jwt_token',
        user: { id: 'uid', email: 'login@test.com', role: 'EVENTEE', createdAt: new Date() },
      } as any);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'password123' })
        .expect(200);

      expect(res.body.accessToken).toBe('jwt_token');
    });

    it('should reject invalid credentials (401)', async () => {
      authService.login.mockRejectedValue(
        new (require('@nestjs/common').UnauthorizedException)('Invalid email or password.'),
      );

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'wrongpass' })
        .expect(401);
    });
  });
});
