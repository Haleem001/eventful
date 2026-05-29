import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { EventsModule } from '../events/events.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [HttpModule, EventsModule, TicketsModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
