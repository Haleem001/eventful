import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const { method, originalUrl } = req;
    const requestId = (req as any).requestId ?? '';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = ctx.getResponse<Response>();
        const ms = Date.now() - start;
        this.logger.log(`${requestId} ${method} ${originalUrl} ${res.statusCode} ${ms}ms`);
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        this.logger.error(`${requestId} ${method} ${originalUrl} ${err.status ?? 500} ${ms}ms - ${err.message}`);
        return throwError(() => err);
      }),
    );
  }
}
