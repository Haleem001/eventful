import { Controller, Get, UseGuards, Req, UseInterceptors, Inject } from '@nestjs/common';
import { CacheTTL, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { UserCacheInterceptor } from '../../common/interceptors/user-cache.interceptor';
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
  constructor(
    private readonly analyticsService: AnalyticsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('creator')
  @Roles(Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(UserCacheInterceptor)
  @CacheTTL(300000)
  @ApiOperation({ summary: 'Get creator dashboard analytics' })
  @ApiOkResponse({ description: 'Analytics retrieved successfully.' })
  @ApiForbiddenResponse({
    description: 'Access denied. Only CREATOR role can access this endpoint.',
  })
  async getCreatorAnalytics(@Req() req: any) {
    return this.analyticsService.getCreatorAnalytics(req.user.id);
  }

  async clearCreatorCache(userId: string) {
    await this.cacheManager.del(`${userId}:/api/analytics/creator`);
  }
}
