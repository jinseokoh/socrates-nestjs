import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import * as cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';``
import { RedisIoAdapter } from 'src/websockets/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  const configService = app.get<ConfigService>(ConfigService);
  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host: configService.get('redis.host'),
      port: configService.get('redis.port'),
    },
  });
  await app.startAllMicroservices();

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  Sentry.init({
    dsn: configService.get('sentry.dsn'),
  });

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  // app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // class-validator requires you to use service containers if you want to inject dependencies into your custom validator constraint classes.
  // https://stackoverflow.com/questions/60062318/how-to-inject-service-to-validator-constraint-interface-in-nestjs-using-class-va
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // firebase config
  initializeApp({
    credential: applicationDefault(),
    // databaseURL: 'https://flea-auction-dev.firebaseio.com',
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors();
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  app.use(cookieParser());

  app.use(async function () {
    throw new Error('My first Sentry error!');
  });

  //! this is for static index.html to run inline and cdn script code. remove this if you don't want.
  // app.use(function (req, res, next) {
  //   res.setHeader(
  //     'Content-Security-Policy',
  //     "default-src 'self'; font-src 'self'; img-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*; style-src 'self'; frame-src 'self'",
  //   );
  //   next();
  // });

  //! see https://expressjs.com/en/guide/behind-proxies.html
  // app.set('trust proxy', true);

  const config = new DocumentBuilder()
    .setTitle('Socrates v1')
    .setDescription('An API running on top of NestJS.')
    .setVersion('1.0')
    .addTag('API written by GoK with lots of 💔')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('appPort');
  await app.listen(port, () => {
    console.log(`running on ${port}`);
  });
}

bootstrap();
