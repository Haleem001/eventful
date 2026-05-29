import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { Reminder } from './entities/reminder.entity';
import { ReminderType } from './enums/reminder-type.enum';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
  ) {}

  async create(
    eventId: string,
    userId: string,
    type: ReminderType,
    remindAt: Date,
  ): Promise<Reminder> {
    const reminder = this.reminderRepository.create({
      eventId,
      userId,
      type,
      remindAt,
    });
    return this.reminderRepository.save(reminder);
  }

  async createFromConfig(
    eventId: string,
    userId: string,
    type: ReminderType,
    eventDate: Date,
    config: string[],
  ): Promise<Reminder[]> {
    const reminders = config.map((key) => {
      const remindAt = calculateRemindAt(eventDate, key);
      return this.reminderRepository.create({
        eventId,
        userId,
        type,
        remindAt,
      });
    });
    return this.reminderRepository.save(reminders);
  }

  async findByUser(userId: string): Promise<Reminder[]> {
    return this.reminderRepository.find({
      where: { userId },
      relations: { event: true },
      order: { remindAt: 'ASC' },
    });
  }

  @Interval(60000)
  async processDueReminders(): Promise<void> {
    const due = await this.reminderRepository.find({
      where: { sent: false, remindAt: LessThanOrEqual(new Date()) },
      relations: { event: true, user: true },
    });

    for (const reminder of due) {
      try {
        this.logger.log(
          `Sending ${reminder.type} reminder for event "${reminder.event.title}" to user ${reminder.user.email}`,
        );
        await this.reminderRepository.update(reminder.id, { sent: true });
      } catch (error) {
        this.logger.error(
          `Failed to process reminder ${reminder.id}: ${error}`,
        );
      }
    }
  }
}

function calculateRemindAt(eventDate: Date, configKey: string): Date {
  const match = configKey.match(/^(\d+)_(DAY|HOUR|MINUTE)_BEFORE$/);
  if (!match) {
    throw new Error(`Invalid reminder config key: ${configKey}`);
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const ms = unit === 'DAY' ? amount * 86400000
    : unit === 'HOUR' ? amount * 3600000
    : amount * 60000;
  return new Date(eventDate.getTime() - ms);
}
