import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(): Promise<Event[]> {
    return this.eventRepository.find({
      order: { date: 'ASC' },
    });
  }

  async findByCreator(creatorId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { creatorId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
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
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: string, creatorId: string): Promise<void> {
    const event = await this.findOne(id);
    if (event.creatorId !== creatorId) {
      throw new ForbiddenException('You can only delete your own events.');
    }
    await this.eventRepository.remove(event);
  }
}
