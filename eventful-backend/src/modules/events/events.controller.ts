import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';

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
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @ApiOperation({ summary: 'Browse all live marketplace events (Public)' })
  @ApiOkResponse({
    description: 'List of all active events retrieved successfully.',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('location') location?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.eventsService.findAll({ page, limit, category, search, location, dateFrom, dateTo });
  }

  @Get('creator')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiOperation({ summary: 'Get events created by the authenticated creator' })
  async findByCreator(@Req() req: any) {
    return this.eventsService.findByCreator(req.user.id);
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

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiOperation({ summary: 'Update an event (Creator only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: any,
  ) {
    return this.eventsService.update(id, updateEventDto, req.user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiOperation({ summary: 'Delete an event (Creator only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    await this.eventsService.remove(id, req.user.id);
    return { message: 'Event deleted successfully.' };
  }
}
