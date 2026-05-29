import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './enums/ticket-status.enum';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async create(
    reference: string,
    eventeeId: string,
    eventId: string,
  ): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      reference,
      eventeeId,
      eventId,
      status: TicketStatus.PAID,
    });
    return this.ticketRepository.save(ticket);
  }

  async findByReference(reference: string): Promise<Ticket | null> {
    return this.ticketRepository.findOne({ where: { reference } });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found.`);
    }
    return ticket;
  }

  async findByUser(eventeeId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { eventeeId },
      relations: { event: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { eventId },
      relations: { eventee: true },
      order: { createdAt: 'DESC' },
    });
  }
}
