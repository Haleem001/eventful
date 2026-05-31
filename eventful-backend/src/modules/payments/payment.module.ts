import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { EventsModule } from '../events/events.module';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [HttpModule, EventsModule, TicketsModule, NotificationsModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
