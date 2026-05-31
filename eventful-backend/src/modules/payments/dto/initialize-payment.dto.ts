import { IsUUID, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty({
    description: 'The UUID of the event to purchase tickets for.',
    example: 'b3f9a2c1-8e5d-4f7a-9c2b-1d6e3f8a0b7c',
  })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @ApiPropertyOptional({
    description:
      'URL to redirect the user to after payment on Paystack. ' +
      'Paystack appends ?reference=... to this URL.',
    example: 'http://localhost:5173/ticket',
  })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({
    description:
      'Reminder timing preference. One of: 1hour, 1day, 1week.',
    example: '1day',
  })
  @IsOptional()
  @IsString()
  @IsIn(['1hour', '1day', '1week'])
  reminder?: string;
}
