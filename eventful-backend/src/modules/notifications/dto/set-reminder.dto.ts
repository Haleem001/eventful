import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetReminderDto {
  @ApiProperty({ description: 'The UUID of the booked event.' })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ description: 'ISO date string for when to fire the reminder.' })
  @IsDateString()
  @IsNotEmpty()
  remindAt: string;
}
