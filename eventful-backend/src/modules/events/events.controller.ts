import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
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
  constructor(
    private readonly eventsService: EventsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

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
    const event = await this.eventsService.create(createEventDto, req.user.id);
    await this.cacheManager.clear();
    return event;
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('events_all')
  @CacheTTL(30000)
  @ApiOperation({ summary: 'Browse all live marketplace events (Public)' })
  @ApiOkResponse({
    description: 'List of all active events retrieved successfully.',
  })
  async findAll() {
    return this.eventsService.findAll();
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
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
    const event = await this.eventsService.update(id, updateEventDto, req.user.id);
    await this.cacheManager.clear();
    return event;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiOperation({ summary: 'Delete an event (Creator only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    await this.eventsService.remove(id, req.user.id);
    await this.cacheManager.clear();
    return { message: 'Event deleted successfully.' };
  }
}
