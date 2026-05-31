import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('creator')
  @Roles(Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get creator dashboard analytics' })
  @ApiOkResponse({ description: 'Analytics retrieved successfully.' })
  @ApiForbiddenResponse({
    description: 'Access denied. Only CREATOR role can access this endpoint.',
  })
  async getCreatorAnalytics(@Req() req: any) {
    return this.analyticsService.getCreatorAnalytics(req.user.id);
  }
}
