import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { TicketsService } from '../tickets/tickets.service';
import { RemindersService } from '../notifications/reminders.service';
import { ReminderType } from '../notifications/enums/reminder-type.enum';
import { EventsService } from '../events/events.service';

@Injectable()
export class PaymentService {
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(TicketsService)
    private readonly ticketsService: TicketsService,
    @Inject(RemindersService)
    private readonly remindersService: RemindersService,
    @Inject(EventsService)
    private readonly eventsService: EventsService,
  ) {}

  private get secretKey(): string {
    return this.configService.getOrThrow<string>('PAYSTACK_SECRET_KEY');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializePayment(
    email: string,
    amount: number,
    reference: string,
    eventId: string,
    eventeeId: string,
    callbackUrl?: string,
    reminder?: string,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const amountInKobo = Math.round(amount * 100);

    const metadata: Record<string, any> = { eventeeId, eventId };
    if (reminder) {
      metadata.reminder = reminder;
    }

    const body: Record<string, any> = {
      email,
      amount: amountInKobo,
      reference,
      metadata,
    };

    if (callbackUrl) {
      body.callback_url = callbackUrl;
    }

    const { data } = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/transaction/initialize`, body, {
        headers: this.headers,
      }),
    );

    if (!data.status) {
      throw new HttpException(
        'Payment initialization failed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<{
    status: string;
    amount: number;
    email: string;
    metadata: Record<string, any>;
  }> {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.headers },
      ),
    );

    if (!data.status) {
      throw new HttpException(
        'Transaction verification failed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      status: data.data.status,
      amount: data.data.amount / 100,
      email: data.data.customer.email,
      metadata: data.data.metadata || {},
    };
  }

  async verifyPayment(
    reference: string,
    eventeeId: string,
  ): Promise<any> {
    const existing = await this.ticketsService.findByReference(reference);
    if (existing) {
      return existing;
    }

    const verification = await this.verifyTransaction(reference);

    if (verification.status !== 'success') {
      throw new HttpException(
        `Payment not successful (${verification.status})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const {
      eventeeId: metaEventeeId,
      eventId: metaEventId,
    } = verification.metadata;

    if (!metaEventeeId || !metaEventId) {
      throw new HttpException(
        'Transaction metadata is incomplete (missing eventeeId or eventId).',
        HttpStatus.BAD_REQUEST,
      );
    }

    const reminderKey = verification.metadata.reminder as string | undefined;

    let ticket: any;
    try {
      ticket = await this.ticketsService.create(
        reference,
        metaEventeeId,
        metaEventId,
      );

      if (reminderKey) {
        try {
          const event = await this.eventsService.findOne(metaEventId);
          const remindAt = new Date(new Date(event.date).getTime() - reminderMs(reminderKey));
          await this.remindersService.create(
            metaEventId,
            metaEventeeId,
            ReminderType.EVENTEE_REMINDER,
            remindAt,
          );
        } catch {}
      }

      return ticket;
    } catch (err: any) {
      if (err?.code === '23505') {
        const existing = await this.ticketsService.findByReference(reference);
        if (existing) {
          return existing;
        }
      }
      throw err;
    }
  }

  verifyWebhookSignature(
    body: string,
    signature: string | undefined,
  ): boolean {
    if (!signature) {
      return false;
    }
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}

const REMINDER_MS: Record<string, number> = {
  '1hour': 3600000,
  '1day': 86400000,
  '1week': 604800000,
};

function reminderMs(key: string): number {
  const ms = REMINDER_MS[key];
  if (!ms) {
    throw new Error(`Unknown reminder key: ${key}`);
  }
  return ms;
}
