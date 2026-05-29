import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new event (Creators Only)' })
  @ApiCreatedResponse({ description: 'Event successfully created.' })
  @ApiForbiddenResponse({
    description:
      'Access denied. Only accounts assigned the CREATOR role can invoke this path.',
  })
  async create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Browse all live marketplace events (Public)' })
  @ApiOkResponse({
    description: 'List of all active events retrieved successfully.',
  })
  async findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific event' })
  @ApiOkResponse({ description: 'Event profile retrieved successfully.' })
  @ApiNotFoundResponse({
    description: 'The requested event unique ID entity does not exist.',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }
}
