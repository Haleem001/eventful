import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { Resend } from 'resend';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let resend: jest.Mocked<Resend>;
  let mockSend: jest.Mock;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('re_test_key'),
    get: jest.fn().mockReturnValue('Eventful <eventful-reminders@mahmoudhaleem.dev>'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    resend = (service as any).resend;
    mockSend = resend.emails.send as jest.Mock;
  });

  describe('sendReminderEmail', () => {
    const emailPayload = {
      to: 'user@example.com',
      eventTitle: 'TechConf 2026',
      eventDate: new Date('2026-08-15T10:00:00Z'),
      venue: 'Convention Center',
    };

    it('should send an email successfully', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

      await expect(
        service.sendReminderEmail(
          emailPayload.to,
          emailPayload.eventTitle,
          emailPayload.eventDate,
          emailPayload.venue,
        ),
      ).resolves.toBeUndefined();
    });

    it('should throw when Resend returns an error', async () => {
      const apiError = new Error('Rate limit exceeded');
      mockSend.mockResolvedValue({ data: null, error: apiError });

      await expect(
        service.sendReminderEmail(
          emailPayload.to,
          emailPayload.eventTitle,
          emailPayload.eventDate,
          emailPayload.venue,
        ),
      ).rejects.toThrow('Rate limit exceeded');
    });
  });
});
