import { Controller, Get, Param, Patch, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user tickets' })
  @ApiOkResponse({ description: 'User tickets retrieved.' })
  async findByUser(@Req() req: any) {
    return this.ticketsService.findByUser(req.user.id);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tickets for a specific event (Creator only)' })
  @ApiOkResponse({ description: 'Event tickets retrieved.' })
  async findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.ticketsService.findByEvent(eventId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiOkResponse({ description: 'Ticket retrieved.' })
  @ApiNotFoundResponse({ description: 'Ticket not found.' })
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a ticket at the door (Creators only)' })
  @ApiOkResponse({ description: 'Ticket verified successfully.' })
  @ApiBadRequestResponse({ description: 'Ticket already used or not paid.' })
  @ApiNotFoundResponse({ description: 'Ticket not found.' })
  async verify(@Param('id') id: string) {
    return this.ticketsService.verify(id);
  }
}
