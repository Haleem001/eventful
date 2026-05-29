import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
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
    const ticket = this.ticketRepository.create({
      reference,
      eventeeId,
      eventId,
      status: TicketStatus.PAID,
    });

    const saved = await this.ticketRepository.save(ticket);

    const qrToken = this.signTicketId(saved.id);
    const qrPayload = JSON.stringify({ ticketId: saved.id, token: qrToken });
    const qrCode = await QRCode.toDataURL(qrPayload);

    saved.qrToken = qrToken;
    saved.qrCode = qrCode;
    return this.ticketRepository.save(saved);
  }

  async verify(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

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
