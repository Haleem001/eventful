import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER, Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import {
  ThrottlerModule,
  ThrottlerGuard,
  getOptionsToken,
  getStorageToken,
} from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentModule } from './modules/payments/payment.module';
import { UsersModule } from './modules/users/users.module';

const frontendDist = join(__dirname, '..', 'frontend-dist');

@Module({
  imports: [
    ...(existsSync(frontendDist)
      ? [
          ServeStaticModule.forRoot({
            rootPath: frontendDist,
            exclude: ['/api/{*any}'],
          }),
        ]
      : []),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 10 }],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DB_URL') ?? '';
        const sslEnabled = configService.get<string>('DB_SSL') === 'true';
        return {
          type: 'postgres',
          url,
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          extra: sslEnabled
            ? { ssl: { rejectUnauthorized: false } }
            : undefined,
        };
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const keyv = new Keyv({ namespace: 'eventful' });
        if (redisUrl) {
          keyv.store = new KeyvRedis(redisUrl);
        }
        return { stores: [keyv], ttl: 60_000 };
      },
    }),
    AuthModule,
    EventsModule,
    TicketsModule,
    AnalyticsModule,
    UsersModule,
    NotificationsModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useFactory: (
        options: ThrottlerModuleOptions,
        storage: ThrottlerStorage,
        reflector: Reflector,
      ) => new ThrottlerGuard(options, storage, reflector),
      inject: [getOptionsToken(), getStorageToken(), Reflector],
    },
    {
      provide: Reflector,
      useValue: new Reflector(),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
