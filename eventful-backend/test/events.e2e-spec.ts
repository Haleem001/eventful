import * as supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { EventsController } from '../src/modules/events/events.controller';
import { EventsService } from '../src/modules/events/events.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Role } from '../src/modules/auth/enums/role.enum';

const request = (supertest as any).default || supertest;

const CI_REFLECTOR = Reflect.getMetadata('design:paramtypes', CacheInterceptor)?.[1] ?? Reflector;
const CI_ADAPTER_HOST = Reflect.getMetadata('design:type', CacheInterceptor.prototype, 'httpAdapterHost');

describe('Events (e2e)', () => {
  let app: INestApplication;
  let eventsService: jest.Mocked<EventsService>;

  const mockJwtGuard = {
    canActivate: (ctx: any) => {
      const req = ctx.switchToHttp().getRequest();
      req.user = { id: 'creator-id', email: 'creator@test.com', role: Role.CREATOR };
      return true;
    },
  };

  beforeAll(async () => {
    eventsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCreator: jest.fn(),
    } as any;

    const moduleFixture = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: eventsService },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), clear: jest.fn() } },
        { provide: CI_REFLECTOR, useValue: new (CI_REFLECTOR as any)() },
        { provide: CI_ADAPTER_HOST, useValue: { httpAdapter: { getRequestMethod: jest.fn().mockReturnValue('POST'), getRequestUrl: jest.fn() } } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('GET /events', () => {
    it('should return paginated events', async () => {
      eventsService.findAll.mockResolvedValue({
        data: [{ id: 'evt-1', title: 'Event 1', description: 'Desc', venue: 'V', date: new Date(), price: '50', capacity: 100, ticketsSold: 0, creatorId: 'c1', createdAt: new Date() } as any],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Event 1');
      expect(res.body.total).toBe(1);
    });

    it('should return empty result when no events', async () => {
      eventsService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });

      const res = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /events/:id', () => {
    it('should return a single event', async () => {
      eventsService.findOne.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', title: 'Event 1' } as any);

      const res = await request(app.getHttpServer())
        .get('/events/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(res.body.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return 404 for nonexistent event', async () => {
      eventsService.findOne.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());

      await request(app.getHttpServer())
        .get('/events/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/events/not-a-uuid')
        .expect(400);
    });
  });

  describe('POST /events', () => {
    it('should create an event as CREATOR (201)', async () => {
      eventsService.create.mockResolvedValue({ id: 'new-evt', title: 'New Event' } as any);

      const res = await request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'New Event',
          description: 'Description',
          venue: 'Venue',
          date: '2026-08-01T00:00:00.000Z',
          price: 99.99,
          capacity: 100,
        })
        .expect(201);

      expect(res.body.title).toBe('New Event');
    });

    it('should reject invalid event data (400)', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send({ title: '' })
        .expect(400);
    });
  });
});
