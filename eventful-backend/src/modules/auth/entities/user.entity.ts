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

  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @Column({ type: 'varchar', nullable: true })
  passwordHash?: string;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationToken?: string;

  @Column({ type: 'varchar', nullable: true })
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry?: Date;

  @Column({ type: 'varchar', nullable: true })
  googleId?: string;

  @Column({ type: 'varchar', default: 'local' })
  authProvider!: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

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
