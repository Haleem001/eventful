import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { RemindersService } from '../notifications/reminders.service';
import { ReminderType } from '../notifications/enums/reminder-type.enum';

describe('EventsService', () => {
  let service: EventsService;
  let eventRepository: Repository<Event>;
  let remindersService: RemindersService;

  const mockEvent: Event = {
    id: 'event-uuid',
    title: 'TechConf 2026',
    description: 'Annual tech conference',
    venue: 'Convention Center',
    date: new Date('2026-08-15T10:00:00Z'),
    price: 99.99,
    capacity: 200,
    ticketsSold: 0,
    category: 'CONFERENCE',
    creatorId: 'creator-uuid',
    creator: null as any,
    tickets: [],
    createdAt: new Date('2026-01-01'),
  };

  const mockCreateDto = {
    title: 'TechConf 2026',
    description: 'Annual tech conference',
    venue: 'Convention Center',
    date: '2026-08-15T10:00:00.000Z',
    price: 99.99,
    capacity: 200,
  };

  const mockEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRemindersService = {
    createFromConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepository },
        { provide: RemindersService, useValue: mockRemindersService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepository = module.get(getRepositoryToken(Event));
    remindersService = module.get<RemindersService>(RemindersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create an event without reminders', async () => {
      mockEventRepository.create.mockReturnValue(mockEvent);
      mockEventRepository.save.mockResolvedValue(mockEvent);

      const result = await service.create(mockCreateDto, 'creator-uuid');

      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        creatorId: 'creator-uuid',
        category: 'OTHER',
      });
      expect(mockRemindersService.createFromConfig).not.toHaveBeenCalled();
      expect(result.title).toBe('TechConf 2026');
    });

    it('should create an event with reminders when reminderConfig is provided', async () => {
      mockEventRepository.create.mockReturnValue(mockEvent);
      mockEventRepository.save.mockResolvedValue(mockEvent);
      mockRemindersService.createFromConfig.mockResolvedValue([]);

      await service.create(
        { ...mockCreateDto, reminderConfig: ['1_DAY_BEFORE', '1_WEEK_BEFORE'] },
        'creator-uuid',
      );

      expect(mockRemindersService.createFromConfig).toHaveBeenCalledWith(
        mockEvent.id,
        'creator-uuid',
        ReminderType.CREATOR_REMINDER,
        mockEvent.date,
        ['1_DAY_BEFORE', '1_WEEK_BEFORE'],
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated events ordered by date ascending', async () => {
      mockEventRepository.findAndCount.mockResolvedValue([[mockEvent], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('TechConf 2026');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(mockEventRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { date: 'ASC' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by category', async () => {
      mockEventRepository.findAndCount.mockResolvedValue([[mockEvent], 1]);

      await service.findAll({ category: 'CONFERENCE' });

      expect(mockEventRepository.findAndCount).toHaveBeenCalledWith({
        where: { category: 'CONFERENCE' },
        order: { date: 'ASC' },
        skip: 0,
        take: 10,
      });
    });

    it('should return empty result when no events exist', async () => {
      mockEventRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.findOne('event-uuid');

      expect(result.id).toBe('event-uuid');
      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-uuid' },
        relations: { creator: true },
      });
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
