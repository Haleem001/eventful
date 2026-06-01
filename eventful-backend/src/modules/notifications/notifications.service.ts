import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.resend = new Resend(
      configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  async sendReminderEmail(
    to: string,
    eventTitle: string,
    eventDate: Date,
    venue: string,
  ): Promise<void> {
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const { error } = await this.resend.emails.send({
      from: this.configService.get<string>('EMAIL_FROM') ?? 'Eventful <eventful-reminders@mahmoudhaleem.dev>',
      to,
      subject: `Reminder: ${eventTitle} is coming up!`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Event Reminder</h2>
          <p><strong>${eventTitle}</strong></p>
          <p>${formattedDate}</p>
          <p>📍 ${venue}</p>
          <hr />
          <p style="color: #666;">See you there! — Eventful Team</p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }

    this.logger.log(`Reminder email sent to ${to} for "${eventTitle}"`);
  }
}
