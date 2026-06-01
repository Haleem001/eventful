import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { Event } from '../events/entities/event.entity';
import { TicketStatus } from './enums/ticket-status.enum';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly configService: ConfigService,
  ) {}

  async create(
    reference: string,
    eventeeId: string,
    eventId: string,
  ): Promise<Ticket> {
    const result = await this.ticketRepository.manager
      .createQueryBuilder()
      .update(Event)
      .set({ ticketsSold: () => '"ticketsSold" + 1' })
      .where('id = :eventId', { eventId })
      .andWhere('"ticketsSold" < capacity')
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException('Event is sold out');
    }

    const ticket = this.ticketRepository.create({
      reference,
      eventeeId,
      eventId,
      status: TicketStatus.PAID,
      qrToken: this.signTicketId(reference),
    });

    ticket.qrCode = await QRCode.toDataURL(ticket.qrToken!, {
      errorCorrectionLevel: 'M',
      width: 256,
    });

    return this.ticketRepository.save(ticket);
  }

  async verify(input: string): Promise<Ticket> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);

    let ticket = await this.ticketRepository.findOne({
      where: { reference: input },
      relations: { event: true },
    });

    if (!ticket && isUuid) {
      ticket = await this.ticketRepository.findOne({
        where: { id: input },
        relations: { event: true },
      });
    }

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID or reference "${input}" not found.`);
    }

    if (ticket.status !== TicketStatus.PAID) {
      throw new BadRequestException('Ticket is not in a paid state.');
    }

    if (ticket.isScanned) {
      throw new BadRequestException('Ticket already used.');
    }

    ticket.isScanned = true;
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

  private signTicketId(ticketId: string): string {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return crypto
      .createHmac('sha256', secret)
      .update(ticketId)
      .digest('hex');
  }
}
