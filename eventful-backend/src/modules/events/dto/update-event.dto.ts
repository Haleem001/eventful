import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  IsIn,
  Min,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const REMINDER_OPTIONS = [
  '1_DAY_BEFORE',
  '2_DAYS_BEFORE',
  '1_WEEK_BEFORE',
  '2_WEEKS_BEFORE',
  '1_HOUR_BEFORE',
] as const;

export class UpdateEventDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  venue?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsIn(['CONCERT', 'SPORTS', 'THEATER', 'FESTIVAL', 'WORKSHOP', 'CONFERENCE', 'OTHER'])
  category?: string;

  @ApiProperty({
    example: ['1_DAY_BEFORE', '1_WEEK_BEFORE'],
    description: 'Reminder schedule for the creator before the event date.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsIn(REMINDER_OPTIONS, { each: true })
  @ArrayMaxSize(5)
  reminderConfig?: string[];
}
