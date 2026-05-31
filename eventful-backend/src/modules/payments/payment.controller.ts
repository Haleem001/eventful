import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EventsService } from '../events/events.service';
import { TicketsService } from '../tickets/tickets.service';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly eventsService: EventsService,
    private readonly ticketsService: TicketsService,
  ) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize a Paystack payment for an event' })
  @ApiCreatedResponse({
    description: 'Authorization URL for Paystack checkout.',
    schema: {
      example: {
        authorizationUrl: 'https://checkout.paystack.com/abc123',
        reference: 'evt_abc123',
      },
    },
  })
  async initialize(
    @Body() dto: InitializePaymentDto,
    @Req() req: any,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const event = await this.eventsService.findOne(dto.eventId);
    const reference = `evt_${uuidv4().slice(0, 8)}`;

    const result = await this.paymentService.initializePayment(
      req.user.email,
      Number(event.price),
      reference,
      dto.eventId,
      req.user.id,
      dto.callbackUrl,
      dto.reminder,
    );

    return result;
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a Paystack transaction and create the ticket' })
  async verify(
    @Body('reference') reference: string,
    @Req() req: any,
  ) {
    return this.paymentService.verifyPayment(reference, req.user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  async webhook(
    @Req() req: Request,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<{ status: string }> {
    const rawBody = (req as any).rawBody as Buffer;
    const rawBodyStr = rawBody ? rawBody.toString() : JSON.stringify(req.body);

    const isValid = this.paymentService.verifyWebhookSignature(
      rawBodyStr,
      signature,
    );
    if (!isValid) {
      return { status: 'invalid signature' };
    }

    const payload = req.body as any;
    if (payload.event !== 'charge.success') {
      return { status: 'ignored' };
    }

    const { reference, status, metadata } = payload.data;
    if (status !== 'success') {
      return { status: 'payment not successful' };
    }

    const existingTicket = await this.ticketsService.findByReference(reference);
    if (existingTicket) {
      return { status: 'duplicate' };
    }

    await this.ticketsService.create(
      reference,
      metadata.eventeeId,
      metadata.eventId,
    );

    return { status: 'success' };
  }
}
