import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: process.env.SENTRY_LOG_LEVEL === 'debug',
});
