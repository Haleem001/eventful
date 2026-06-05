import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { PaymentService } from './payment.service';
import { TicketsService } from '../tickets/tickets.service';
import { RemindersService } from '../notifications/reminders.service';
import { EventsService } from '../events/events.service';
import * as crypto from 'crypto';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpService: HttpService;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('sk_test_secret_key'),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockTicketsService = {};
  const mockRemindersService = {};
  const mockEventsService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: RemindersService, useValue: mockRemindersService },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('initializePayment', () => {
    it('should return authorizationUrl and reference on success', async () => {
      mockHttpService.post.mockReturnValue(
        of({
          data: {
            status: true,
            data: {
              authorization_url: 'https://paystack.com/checkout/abc',
              reference: 'evt_ref123',
            },
          },
        }),
      );

      const result = await service.initializePayment(
        'user@example.com',
        5000,
        'evt_ref123',
        'event-id',
        'user-id',
      );

      expect(result.authorizationUrl).toBe(
        'https://paystack.com/checkout/abc',
      );
      expect(result.reference).toBe('evt_ref123');
    });

    it('should throw HttpException when Paystack returns status false', async () => {
      mockHttpService.post.mockReturnValue(
        of({
          data: { status: false, message: 'Invalid amount' },
        }),
      );

      await expect(
        service.initializePayment('user@example.com', -1, 'evt_ref123', 'event-id', 'user-id'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('verifyTransaction', () => {
    it('should return transaction details on success', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            status: true,
            data: {
              status: 'success',
              amount: 500000,
              customer: { email: 'user@example.com' },
            },
          },
        }),
      );

      const result = await service.verifyTransaction('evt_ref123');

      expect(result.status).toBe('success');
      expect(result.amount).toBe(5000);
      expect(result.email).toBe('user@example.com');
    });

    it('should throw HttpException on verification failure', async () => {
      mockHttpService.get.mockReturnValue(
        of({ data: { status: false, message: 'Transaction not found' } }),
      );

      await expect(
        service.verifyTransaction('invalid_ref'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for a valid signature', () => {
      const body = JSON.stringify({ event: 'charge.success' });
      const expectedSignature = crypto
        .createHmac('sha512', 'sk_test_secret_key')
        .update(body)
        .digest('hex');

      const result = service.verifyWebhookSignature(body, expectedSignature);

      expect(result).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      const body = JSON.stringify({ event: 'charge.success' });

      const result = service.verifyWebhookSignature(body, 'invalid_sig');

      expect(result).toBe(false);
    });

    it('should return false when no signature is provided', () => {
      const result = service.verifyWebhookSignature(
        JSON.stringify({ event: 'charge.success' }),
        undefined,
      );

      expect(result).toBe(false);
    });
  });
});
