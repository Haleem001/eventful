import * as supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TicketsController } from '../src/modules/tickets/tickets.controller';
import { TicketsService } from '../src/modules/tickets/tickets.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '../src/modules/auth/enums/role.enum';

const request = (supertest as any).default || supertest;

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('Tickets (e2e)', () => {
  let app: INestApplication;
  let ticketsService: jest.Mocked<TicketsService>;

  const mockJwtGuard = {
    canActivate: (ctx: any) => {
      const req = ctx.switchToHttp().getRequest();
      req.user = { id: 'creator-id', email: 'creator@test.com', role: Role.CREATOR };
      return true;
    },
  };

  beforeAll(async () => {
    ticketsService = {
      verify: jest.fn(),
      findOne: jest.fn(),
      findByReference: jest.fn(),
      findByUser: jest.fn(),
      findByEvent: jest.fn(),
    } as any;

    const moduleFixture = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        { provide: TicketsService, useValue: ticketsService },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('PATCH /tickets/:id/verify', () => {
    it('should verify a paid ticket (200)', async () => {
      ticketsService.verify.mockResolvedValue({ id: VALID_UUID, isScanned: true } as any);

      const res = await request(app.getHttpServer())
        .patch(`/tickets/${VALID_UUID}/verify`)
        .expect(200);

      expect(res.body.isScanned).toBe(true);
    });

    it('should reject already-scanned ticket (400)', async () => {
      ticketsService.verify.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Ticket already used.'),
      );

      await request(app.getHttpServer())
        .patch(`/tickets/${VALID_UUID}/verify`)
        .expect(400);
    });

    it('should reject non-paid ticket (400)', async () => {
      ticketsService.verify.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Ticket is not in a paid state.'),
      );

      await request(app.getHttpServer())
        .patch(`/tickets/${VALID_UUID}/verify`)
        .expect(400);
    });

    it('should return 404 for nonexistent ticket', async () => {
      ticketsService.verify.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)(),
      );

      await request(app.getHttpServer())
        .patch(`/tickets/${VALID_UUID}/verify`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .patch('/tickets/not-a-uuid/verify')
        .expect(400);
    });
  });
});
