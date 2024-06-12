import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { SlackService } from 'nestjs-slack';
@Catch()
export class SentryErrorReportFilter extends BaseExceptionFilter {
  constructor(@Inject(SlackService) private readonly slack: SlackService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (httpStatus >= 500 && process.env.NODE_ENV != 'local') {
      Sentry.captureException(exception);
      this.notifySlack(exception as any);
    }
    super.catch(exception, host);
  }

  async notifySlack(exception: any) {
    await this.slack.postMessage({
      channel: 'errors',
      attachments: [
        {
          color: 'danger',
          text: `[${process.env.NODE_ENV}환경] 🆘 500 오류.`,
          fields: [
            {
              title: `Query`,
              value: exception?.query ?? 'n/a',
              short: false,
            },
            {
              title: `Params`,
              value: exception?.parameters?.join(',') ?? 'n/a',
              short: false,
            },
            {
              title: `Message`,
              value: exception?.message ?? 'n/a',
              short: true,
            },
          ],
        },
      ],
    });
  }
}
