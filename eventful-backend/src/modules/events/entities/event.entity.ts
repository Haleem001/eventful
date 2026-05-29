import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 255, default: 'Virtual / TBA' })
  venue!: string;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'int', default: 0 })
  ticketsSold!: number;

  @ManyToOne(() => User, (user) => user.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator!: User;

  @Column()
  creatorId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
