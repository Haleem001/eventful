import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketStatus } from '../tickets/enums/ticket-status.enum';

export interface EventBreakdown {
  eventId: string;
  title: string;
  capacity: number;
  ticketsSold: number;
  scanned: number;
  revenue: number;
}

export interface CreatorAnalytics {
  totalRevenue: number;
  totalTicketsSold: number;
  totalScanned: number;
  events: EventBreakdown[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async getCreatorAnalytics(creatorId: string): Promise<CreatorAnalytics> {
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .select(['event.id', 'event.title', 'event.capacity', 'event.price'])
      .where('event.creatorId = :creatorId', { creatorId })
      .getMany();

    const eventIds = events.map((e) => e.id);

    if (eventIds.length === 0) {
      return { totalRevenue: 0, totalTicketsSold: 0, totalScanned: 0, events: [] };
    }

    const [paidCounts, scanCounts] = await Promise.all([
      this.ticketRepository
        .createQueryBuilder('ticket')
        .select('ticket."eventId"', 'eventId')
        .addSelect('COUNT(*)', 'count')
        .where('ticket."eventId" IN (:...eventIds)', { eventIds })
        .andWhere('ticket.status = :status', { status: TicketStatus.PAID })
        .groupBy('ticket."eventId"')
        .getRawMany<{ eventId: string; count: string }>(),
      this.ticketRepository
        .createQueryBuilder('ticket')
        .select('ticket."eventId"', 'eventId')
        .addSelect('COUNT(*)', 'scanned')
        .where('ticket."eventId" IN (:...eventIds)', { eventIds })
        .andWhere('ticket."isScanned" = :isScanned', { isScanned: true })
        .groupBy('ticket."eventId"')
        .getRawMany<{ eventId: string; scanned: string }>(),
    ]);

    const paidMap = new Map(paidCounts.map((r) => [r.eventId, parseInt(r.count, 10)]));
    const scanMap = new Map(scanCounts.map((r) => [r.eventId, parseInt(r.scanned, 10)]));

    const breakdown: EventBreakdown[] = events.map((event) => {
      const ticketsSold = paidMap.get(event.id) ?? 0;
      return {
        eventId: event.id,
        title: event.title,
        capacity: event.capacity,
        ticketsSold,
        scanned: scanMap.get(event.id) ?? 0,
        revenue: ticketsSold * Number(event.price),
      };
    });

    return {
      totalRevenue: breakdown.reduce((sum, e) => sum + e.revenue, 0),
      totalTicketsSold: breakdown.reduce((sum, e) => sum + e.ticketsSold, 0),
      totalScanned: breakdown.reduce((sum, e) => sum + e.scanned, 0),
      events: breakdown,
    };
  }
}
