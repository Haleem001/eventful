import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { EventsService } from '../events/events.service';
import type { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly eventsService: EventsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    const result = await this.paymentService.initializePayment(
      req.user.email,
      Number(event.price),
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
    const result = await this.paymentService.verifyPayment(reference, req.user.id);
    await this.cacheManager.del(`${req.user.id}:/api/tickets/user`);
    return result;
  }

  @Get('transactions/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment transactions for an event (Creator only)' })
  async getTransactions(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Req() req: any,
  ) {
    return this.paymentService.getTransactions(eventId, req.user.id);
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
    return this.paymentService.handleWebhook(payload);
  }
}
