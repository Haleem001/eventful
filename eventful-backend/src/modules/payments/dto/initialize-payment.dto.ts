import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty({
    description: 'The UUID of the event to purchase tickets for.',
    example: 'b3f9a2c1-8e5d-4f7a-9c2b-1d6e3f8a0b7c',
  })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}
