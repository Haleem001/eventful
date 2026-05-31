import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { RemindersService } from './reminders.service';
import { Reminder } from './entities/reminder.entity';
import { ReminderType } from './enums/reminder-type.enum';
import { NotificationsService } from './notifications.service';

describe('RemindersService', () => {
  let service: RemindersService;
  let reminderRepository: Repository<Reminder>;
  let notificationsService: NotificationsService;

  const mockReminder: Reminder = {
    id: 'reminder-uuid',
    eventId: 'event-uuid',
    event: null as any,
    userId: 'user-uuid',
    user: null as any,
    type: ReminderType.CREATOR_REMINDER,
    remindAt: new Date('2026-08-14T10:00:00Z'),
    sent: false,
    createdAt: new Date(),
  };

  const mockReminderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockNotificationsService = {
    sendReminderEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: getRepositoryToken(Reminder),
          useValue: mockReminderRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
    reminderRepository = module.get(getRepositoryToken(Reminder));
    notificationsService = module.get<NotificationsService>(
      NotificationsService,
    );
  });

  describe('create', () => {
    it('should create and return a single reminder', async () => {
      const remindAt = new Date('2026-08-14T10:00:00Z');
      mockReminderRepository.create.mockReturnValue(mockReminder);
      mockReminderRepository.save.mockResolvedValue(mockReminder);

      const result = await service.create(
        'event-uuid',
        'user-uuid',
        ReminderType.EVENTEE_REMINDER,
        remindAt,
      );

      expect(mockReminderRepository.create).toHaveBeenCalledWith({
        eventId: 'event-uuid',
        userId: 'user-uuid',
        type: ReminderType.EVENTEE_REMINDER,
        remindAt,
      });
      expect(result.id).toBe('reminder-uuid');
    });
  });

  describe('createFromConfig', () => {
    it('should create reminders for each config entry', async () => {
      const eventDate = new Date('2026-08-15T10:00:00Z');
      mockReminderRepository.create.mockReturnValue(mockReminder);
      mockReminderRepository.save.mockResolvedValue([mockReminder, mockReminder]);

      const result = await service.createFromConfig(
        'event-uuid',
        'user-uuid',
        ReminderType.CREATOR_REMINDER,
        eventDate,
        ['1_DAY_BEFORE', '1_HOUR_BEFORE'],
      );

      expect(mockReminderRepository.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('processDueReminders', () => {
    it('should process due reminders and mark them as sent', async () => {
      const dueReminder: Reminder = {
        ...mockReminder,
        user: { id: 'user-uuid', email: 'user@test.com' } as any,
        event: {
          id: 'event-uuid',
          title: 'Test Event',
          date: new Date('2026-08-15T10:00:00Z'),
          venue: 'Venue',
        } as any,
      };

      mockReminderRepository.find.mockResolvedValue([dueReminder]);
      mockNotificationsService.sendReminderEmail.mockResolvedValue(undefined);
      mockReminderRepository.update.mockResolvedValue({} as any);

      await service.processDueReminders();

      expect(mockNotificationsService.sendReminderEmail).toHaveBeenCalledWith(
        'user@test.com',
        'Test Event',
        expect.any(Date),
        'Venue',
      );
      expect(mockReminderRepository.update).toHaveBeenCalledWith(
        'reminder-uuid',
        { sent: true },
      );
    });

    it('should not crash when a reminder email fails', async () => {
      const dueReminder: Reminder = {
        ...mockReminder,
        user: { id: 'user-uuid', email: 'user@test.com' } as any,
        event: {
          id: 'event-uuid',
          title: 'Test Event',
          date: new Date('2026-08-15T10:00:00Z'),
          venue: 'Venue',
        } as any,
      };

      mockReminderRepository.find.mockResolvedValue([dueReminder]);
      mockNotificationsService.sendReminderEmail.mockRejectedValue(
        new Error('SMTP error'),
      );
      mockReminderRepository.update.mockResolvedValue({} as any);

      await expect(
        service.processDueReminders(),
      ).resolves.toBeUndefined();

      expect(mockReminderRepository.update).not.toHaveBeenCalled();
    });
  });
});
