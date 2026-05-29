import { Controller, Param, Patch, UseGuards, ParseUUIDPipe } from '@nestjs/common';
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

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a ticket at the door (Creators only)' })
  @ApiOkResponse({ description: 'Ticket verified successfully.' })
  @ApiBadRequestResponse({ description: 'Ticket already used or not paid.' })
  @ApiNotFoundResponse({ description: 'Ticket not found.' })
  async verify(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.verify(id);
  }
}
