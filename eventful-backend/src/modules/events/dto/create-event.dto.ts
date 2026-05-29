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

export class CreateEventDto {
  @ApiProperty({
    example: 'TechCon 2026',
    description: 'The title of the event',
  })
  @IsString({ message: 'Title must be a string.' })
  @IsNotEmpty({ message: 'Title is required.' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters.' })
  title!: string;

  @ApiProperty({
    example: 'The ultimate gathering for developers.',
    description: 'Detailed event description',
  })
  @IsString({ message: 'Description must be a string.' })
  @IsNotEmpty({ message: 'Description is required.' })
  description!: string;

  @ApiProperty({
    example: 'International Conference Centre, Abuja',
    description: 'The physical venue or access link',
  })
  @IsString({ message: 'Venue must be a string.' })
  @IsNotEmpty({ message: 'Venue details are required.' })
  @MaxLength(255, { message: 'Venue address cannot exceed 255 characters.' })
  venue!: string;

  @ApiProperty({
    example: '2026-06-15T18:00:00.000Z',
    description: 'ISO string of the event date',
  })
  @IsDateString({}, { message: 'Date must be a valid ISO date string.' })
  @IsNotEmpty({ message: 'Event date is required.' })
  date!: string;

  @ApiProperty({
    example: 15000.0,
    description: 'Ticket price',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a valid number with max 2 decimal places.' },
  )
  @Min(0, { message: 'Price cannot be negative.' })
  price!: number;

  @ApiProperty({
    example: 250,
    description: 'Maximum capacity of attendees',
  })
  @IsNumber({}, { message: 'Capacity must be an integer number.' })
  @Min(1, { message: 'Capacity must be at least 1.' })
  capacity!: number;

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
