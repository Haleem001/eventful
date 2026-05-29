import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [TypeOrmModule, EventsService],
})
export class EventsModule {}
