import * as supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AnalyticsController } from '../src/modules/analytics/analytics.controller';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '../src/modules/auth/enums/role.enum';

const request = (supertest as any).default || supertest;

describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let analyticsService: jest.Mocked<AnalyticsService>;

  const mockJwtGuard = {
    canActivate: (ctx: any) => {
      const req = ctx.switchToHttp().getRequest();
      req.user = { id: 'creator-id', email: 'creator@test.com', role: Role.CREATOR };
      return true;
    },
  };

  beforeAll(async () => {
    analyticsService = {
      getCreatorAnalytics: jest.fn(),
    } as any;

    const moduleFixture = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: analyticsService },
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

  describe('GET /analytics/creator', () => {
    it('should return analytics for a creator with events', async () => {
      analyticsService.getCreatorAnalytics.mockResolvedValue({
        totalRevenue: 4499.55,
        totalTicketsSold: 45,
        totalScanned: 10,
        events: [
          {
            eventId: 'evt-1',
            title: 'TechConf',
            capacity: 200,
            ticketsSold: 45,
            scanned: 10,
            revenue: 4499.55,
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .get('/analytics/creator')
        .expect(200);

      expect(res.body.totalRevenue).toBe(4499.55);
      expect(res.body.totalTicketsSold).toBe(45);
      expect(res.body.totalScanned).toBe(10);
      expect(res.body.events).toHaveLength(1);
    });

    it('should return zeros for a creator with no events', async () => {
      analyticsService.getCreatorAnalytics.mockResolvedValue({
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalScanned: 0,
        events: [],
      });

      const res = await request(app.getHttpServer())
        .get('/analytics/creator')
        .expect(200);

      expect(res.body).toEqual({
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalScanned: 0,
        events: [],
      });
    });
  });
});
