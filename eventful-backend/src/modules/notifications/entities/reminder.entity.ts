import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../auth/entities/user.entity';
import { ReminderType } from '../enums/reminder-type.enum';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  eventId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @Column({ type: 'enum', enum: ReminderType })
  type!: ReminderType;

  @Column({ type: 'timestamp' })
  remindAt!: Date;

  @Column({ type: 'boolean', default: false })
  sent!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
