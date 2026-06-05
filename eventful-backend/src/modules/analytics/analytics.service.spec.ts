import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let eventRepository: Repository<Event>;
  let ticketRepository: Repository<Ticket>;

  const mockEvent = {
    id: 'event-uuid',
    title: 'TechConf 2026',
    capacity: 200,
    ticketsSold: 45,
    price: '99.99',
    creatorId: 'creator-uuid',
    date: new Date('2026-08-15'),
    description: 'desc',
    venue: 'Venue',
    creator: null as any,
    tickets: [],
    createdAt: new Date(),
  };

  const mockEventQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockScanQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockEventRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockTicketRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepository },
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    eventRepository = module.get(getRepositoryToken(Event));
    ticketRepository = module.get(getRepositoryToken(Ticket));
  });

  describe('getCreatorAnalytics', () => {
    it('should return analytics for a creator with events', async () => {
      mockEventRepository.createQueryBuilder.mockReturnValue(
        mockEventQueryBuilder,
      );
      mockTicketRepository.createQueryBuilder.mockReturnValue(
        mockScanQueryBuilder,
      );

      mockEventQueryBuilder.getMany.mockResolvedValue([mockEvent]);
      mockScanQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ eventId: 'event-uuid', count: '45' }])
        .mockResolvedValueOnce([{ eventId: 'event-uuid', scanned: '10' }]);

      const result = await service.getCreatorAnalytics('creator-uuid');

      expect(result.totalRevenue).toBe(45 * 99.99);
      expect(result.totalTicketsSold).toBe(45);
      expect(result.totalScanned).toBe(10);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        eventId: 'event-uuid',
        title: 'TechConf 2026',
        capacity: 200,
        ticketsSold: 45,
        scanned: 10,
      });
    });

    it('should return empty analytics when creator has no events', async () => {
      mockEventRepository.createQueryBuilder.mockReturnValue(
        mockEventQueryBuilder,
      );
      mockEventQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getCreatorAnalytics('creator-uuid');

      expect(result).toEqual({
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalScanned: 0,
        events: [],
      });
    });

    it('should handle zero scanned tickets', async () => {
      mockEventRepository.createQueryBuilder.mockReturnValue(
        mockEventQueryBuilder,
      );
      mockTicketRepository.createQueryBuilder.mockReturnValue(
        mockScanQueryBuilder,
      );

      mockEventQueryBuilder.getMany.mockResolvedValue([mockEvent]);
      mockScanQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ eventId: 'event-uuid', count: '45' }])
        .mockResolvedValueOnce([]);

      const result = await service.getCreatorAnalytics('creator-uuid');

      expect(result.totalScanned).toBe(0);
      expect(result.events[0].scanned).toBe(0);
    });
  });
});
