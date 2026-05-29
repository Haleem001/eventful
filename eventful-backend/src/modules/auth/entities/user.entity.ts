import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../enums/role.enum';
import { Event } from '../../events/entities/event.entity'; // Import the Event entity

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.EVENTEE,
  })
  role!: Role;

  // One User (Creator) can host many Events
  @OneToMany(() => Event, (event) => event.creator)
  events!: Event[];

  @CreateDateColumn()
  createdAt!: Date;
}
