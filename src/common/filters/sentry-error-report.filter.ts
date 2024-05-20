import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';
@Catch()
export class SentryErrorReportFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (httpStatus >= 500) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
