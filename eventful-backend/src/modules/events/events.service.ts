import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    creatorId: string,
  ): Promise<Event> {
    const newEvent = this.eventRepository.create({
      ...createEventDto,
      creatorId,
    });
    return this.eventRepository.save(newEvent);
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepository.find({
      order: { date: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found.`);
    }
    return event;
  }
}
