import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import * as firebaseAdmin from 'firebase-admin';
import helmet from 'helmet';
import { AppModule } from 'src/app.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { IFirebaseConfig, IRedisConfig } from './common/interfaces/index';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  const configService = app.get<ConfigService>(ConfigService);
  const redisConfig = configService.get<IRedisConfig>('redis');
  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host: redisConfig.host,
      port: redisConfig.port,
    },
  });
  await app.startAllMicroservices();

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

  const firebaseConfig = configService.get<IFirebaseConfig>('firebase');
  // https://dev.to/aswinsanakan/how-to-integrate-firebase-in-nestjs-5gl9
  const serviceAccount: firebaseAdmin.ServiceAccount = {
    projectId: firebaseConfig.projectId,
    privateKey: firebaseConfig.privateKey.replace(/\\n/g, '\n'),
    clientEmail: firebaseConfig.clientEmail,
  };
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    // databaseURL: 'https://flea-auction-dev.firebaseio.com',
  });

  app.enableCors();
  app.use(helmet());
  // app.use(sseMiddleware);
  app.use(helmet.hidePoweredBy());

  const config = new DocumentBuilder()
    .setTitle('Meet Sage v1')
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
