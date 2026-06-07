import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { ERROR_MESSAGES } from '../helpers/error-messages';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = ERROR_MESSAGES[500];
    const requestId = (request as any).requestId ?? '';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (exception instanceof ThrottlerException) {
        message = ERROR_MESSAGES[429];
      } else if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const obj = res as Record<string, any>;
        const rawMessage = obj.message ?? obj.error ?? message;
        if (Array.isArray(rawMessage)) {
          message = rawMessage[0];
        } else {
          message = rawMessage;
        }
      }
    }

    const logMessage = `${requestId} ${request.method} ${request.url} ${status} - ${message}`;
    if (status >= 500) {
      this.logger.error(logMessage);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
