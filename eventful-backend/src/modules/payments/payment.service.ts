import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private get secretKey(): string {
    return this.configService.getOrThrow<string>('PAYSTACK_SECRET_KEY');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializePayment(
    email: string,
    amount: number,
    reference: string,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const amountInKobo = Math.round(amount * 100);

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/transaction/initialize`,
        { email, amount: amountInKobo, reference },
        { headers: this.headers },
      ),
    );

    if (!data.status) {
      throw new HttpException(
        'Payment initialization failed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<{
    status: string;
    amount: number;
    email: string;
  }> {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.headers },
      ),
    );

    if (!data.status) {
      throw new HttpException(
        'Transaction verification failed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      status: data.data.status,
      amount: data.data.amount / 100,
      email: data.data.customer.email,
    };
  }

  verifyWebhookSignature(
    body: string,
    signature: string | undefined,
  ): boolean {
    if (!signature) {
      return false;
    }
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}
