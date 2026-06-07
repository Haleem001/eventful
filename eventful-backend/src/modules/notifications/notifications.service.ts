import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly configService: ConfigService;
  private readonly from: string;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.resend = new Resend(
      configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.from = this.configService.get<string>('EMAIL_FROM') ?? 'Eventful <eventful-reminders@mahmoudhaleem.dev>';
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }

    this.logger.log(`Email sent to ${to}: "${subject}"`);
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

    await this.send(
      to,
      `Reminder: ${eventTitle} is coming up!`,
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Event Reminder</h2>
          <p><strong>${eventTitle}</strong></p>
          <p>${formattedDate}</p>
          <p>📍 ${venue}</p>
          <hr />
          <p style="color: #666;">See you there! — Eventful Team</p>
        </div>
      `,
    );
  }

  async sendPurchaseConfirmation(
    to: string,
    eventTitle: string,
    reference: string,
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

    await this.send(
      to,
      `Your ticket for ${eventTitle} is confirmed!`,
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>🎫 Ticket Confirmed</h2>
          <p>Your payment was successful. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #666;">Event</td><td style="padding: 8px 0; font-weight: 600;">${eventTitle}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0;">${formattedDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Venue</td><td style="padding: 8px 0;">📍 ${venue}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Reference</td><td style="padding: 8px 0; font-family: monospace; font-size: 13px;">${reference.toUpperCase()}</td></tr>
          </table>
          <hr />
          <p style="color: #666;">Show your QR code at the door to check in. See you there! — Eventful Team</p>
        </div>
      `,
    );
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const link = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

    await this.send(
      to,
      'Verify your email — Eventful',
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Welcome to Eventful!</h2>
          <p>Click the button below to verify your email address.</p>
          <a href="${link}" style="display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 16px 0;">Verify Email</a>
          <p style="color: #666;">Or copy this link: <br/><span style="font-size: 12px;">${link}</span></p>
          <hr />
          <p style="color: #666;">— Eventful Team</p>
        </div>
      `,
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await this.send(
      to,
      'Reset your password — Eventful',
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${link}" style="display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 16px 0;">Reset Password</a>
          <p style="color: #666;">Or copy this link: <br/><span style="font-size: 12px;">${link}</span></p>
          <hr />
          <p style="color: #666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    );
  }
}
