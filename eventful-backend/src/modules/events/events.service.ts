import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RemindersService } from '../notifications/reminders.service';
import { ReminderType } from '../notifications/enums/reminder-type.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly remindersService: RemindersService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    creatorId: string,
  ): Promise<Event> {
    const { reminderConfig, ...eventData } = createEventDto;

    const newEvent = this.eventRepository.create({
      ...eventData,
      creatorId,
      category: eventData.category || 'OTHER',
    });

    const savedEvent = await this.eventRepository.save(newEvent);

    if (reminderConfig && reminderConfig.length > 0) {
      await this.remindersService.createFromConfig(
        savedEvent.id,
        creatorId,
        ReminderType.CREATOR_REMINDER,
        new Date(savedEvent.date),
        reminderConfig,
      );
    }

    return savedEvent;
  }

  async findAll(query: { page?: number; limit?: number; category?: string; search?: string; location?: string; dateFrom?: string; dateTo?: string } = {}): Promise<{ data: Event[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 10, category, search, location, dateFrom, dateTo } = query;

    const where: any = {};
    if (category) where.category = category;
    if (search) where.title = ILike(`%${search}%`);
    if (location) where.venue = ILike(`%${location}%`);

    if (dateFrom && dateTo) {
      where.date = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.date = MoreThanOrEqual(new Date(dateFrom));
    } else if (dateTo) {
      where.date = LessThanOrEqual(new Date(dateTo));
    }

    const [data, total] = await this.eventRepository.findAndCount({
      where,
      order: { date: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByCreator(creatorId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { creatorId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id }, relations: { creator: true } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found.`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, creatorId: string): Promise<Event> {
    const event = await this.findOne(id);
    if (event.creatorId !== creatorId) {
      throw new ForbiddenException('You can only edit your own events.');
    }
    const { reminderConfig, ...eventData } = updateEventDto;
    Object.assign(event, eventData);
    const savedEvent = await this.eventRepository.save(event);

    if (reminderConfig) {
      await this.remindersService.createFromConfig(
        savedEvent.id,
        creatorId,
        ReminderType.CREATOR_REMINDER,
        new Date(savedEvent.date),
        reminderConfig,
      );
    }

    return savedEvent;
  }

  async remove(id: string, creatorId: string): Promise<void> {
    const event = await this.findOne(id);
    if (event.creatorId !== creatorId) {
      throw new ForbiddenException('You can only delete your own events.');
    }
    await this.eventRepository.remove(event);
  }
}
