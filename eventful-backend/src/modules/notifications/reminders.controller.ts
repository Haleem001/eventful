import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { SetReminderDto } from './dto/set-reminder.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReminderType } from './enums/reminder-type.enum';

@ApiTags('Reminders')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a custom reminder for a booked event' })
  @ApiCreatedResponse({ description: 'Reminder created.' })
  async create(
    @Body() dto: SetReminderDto,
    @Req() req: any,
  ) {
    return this.remindersService.create(
      dto.eventId,
      req.user.id,
      ReminderType.EVENTEE_REMINDER,
      new Date(dto.remindAt),
    );
  }
}
