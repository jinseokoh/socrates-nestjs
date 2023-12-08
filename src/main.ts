import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { join } from 'path';

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

  // Create new DynamoDB instance
  // dynamoose.aws.ddb.local();
  // const ddb = new dynamoose.aws.ddb.DynamoDB({
  //   credentials: {
  //     accessKeyId: configService.get('aws.accessKey'),
  //     secretAccessKey: configService.get('aws.secretAccessKey'),
  //   },
  //   region: configService.get('aws.defaultRegion'),
  // });
  // dynamoose.aws.ddb.set(ddb);

  app.setGlobalPrefix('v1', { exclude: ['/'] });
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

  app.enableCors();
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  app.use(cookieParser());
  // see https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true);

  // websocket client for basic test
  app.useStaticAssets(join(__dirname, '..', 'static'));

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
