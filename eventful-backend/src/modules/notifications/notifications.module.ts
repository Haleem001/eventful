import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Reminder } from './entities/reminder.entity';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Reminder]),
    ConfigModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, NotificationsService],
  exports: [RemindersService, NotificationsService],
})
export class NotificationsModule {}
