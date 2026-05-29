import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { TicketStatus } from '../enums/ticket-status.enum';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  reference: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.PENDING })
  status: TicketStatus;

  @Column({ type: 'boolean', default: false })
  isScanned: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventeeId' })
  eventee: User;

  @Column()
  eventeeId: string;

  @ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @CreateDateColumn()
  createdAt: Date;
}
