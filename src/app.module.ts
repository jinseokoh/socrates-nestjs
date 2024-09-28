import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DynamooseModule } from 'nestjs-dynamoose';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as redisStore from 'cache-manager-ioredis';
import { DataSource } from 'typeorm';
import { SlackModule } from 'nestjs-slack';

import { configuration } from 'src/common/config/configuration';
import { DuplicateEntryErrorInterceptor } from 'src/common/interceptors/duplicate-entry-error.interceptor';
import { getAwsDatabaseConfig } from 'src/common/config/aws-database';
import { HttpCacheInterceptor } from 'src/common/interceptors/http-cache.interceptor';
import { IAwsConfig, IDatabaseConfig } from 'src/common/interfaces';
import { SentryErrorReportFilter } from 'src/common/filters/sentry-error-report.filter';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';

import { AlarmsModule } from 'src/domain/alarms/alarms.module';
import { AuthModule } from 'src/domain/auth/auth.module';
import { BannersModule } from 'src/domain/banners/banners.module';
import { CareersModule } from 'src/domain/careers/careers.module';
import { CategoriesModule } from 'src/domain/categories/categories.module';
import { ChatsModule } from 'src/domain/chats/chats.module';
import { ContentsModule } from 'src/domain/contents/contents.module';
import { FeedsModule } from 'src/domain/feeds/feeds.module';
import { IcebreakersModule } from 'src/domain/icebreakers/icebreakers.module';
import { InquiriesModule } from 'src/domain/inquiries/inquiries.module';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt-auth.guard';
import { LanguagesModule } from 'src/domain/languages/languages.module';
import { LedgersModule } from 'src/domain/ledgers/ledgers.module';
import { MeetupsModule } from 'src/domain/meetups/meetups.module';
import { UsersModule } from 'src/domain/users/users.module';

import { FcmModule } from 'src/services/fcm/fcm.module';
import { NaverModule } from 'src/services/naver/naver.module';
import { RedisModule } from 'src/services/redis/redis.module';
import { SocketIoModule } from 'src/websockets/socketio.module';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
// import { CustomLogger } from 'src/helpers/custom-logger';
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'), // for index.html
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Use useFactory, useClass, or useExisting to configure the DataSourceOptions.
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        const nodeEnv = configService.get<string>('nodeEnv');
        const awsConfig = configService.get<IAwsConfig>('aws');
        const databaseConfig =
          nodeEnv === 'ecs' // for ECS deployment. not being used at this moment
            ? await getAwsDatabaseConfig(awsConfig)
            : configService.get<IDatabaseConfig>('database');

        return {
          type: databaseConfig.engine,
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.dbname,
          subscribers: ['dist/**/*.subscriber{.ts,.js}'],
          entities: ['dist/**/*.entity{.ts,.js}'],
          synchronize: nodeEnv === 'local',
          timezone: 'Z', // UTC
          bigNumberStrings: true,
          supportBigNumbers: true,
          logging: nodeEnv === 'local',
          // logger: new CustomLogger(),
          migrations: ['dist/migrations/**/*{.ts,.js}'],
          cli: {
            migrationsDir: 'dist/migrations',
          },
        } as TypeOrmModuleOptions;
      },
      // dataSource receives the configured DataSourceOptions and returns a Promise<DataSource>.
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        db: 0,
        ttl: 60 * 5, // default to 5 mins
      }),
    }),
    DynamooseModule.forRoot({
      local: process.env.NODE_ENV === 'local',
      aws: {
        region: process.env.AWS_DEFAULT_REGION ?? 'ap-northeast-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      table: {
        create: process.env.NODE_ENV === 'local', // create dynamo tables in local env
        prefix: `${process.env.NODE_ENV}_`,
        suffix: '_table',
      },
    }),
    SlackModule.forRootAsync({
      isGlobal: true,
      // imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'webhook',
        channels: [
          {
            name: 'activities',
            url: configService.get<string>('slack.activitiesChannel'),
          },
          {
            name: 'errors',
            url: configService.get<string>('slack.errorsChannel'),
          },
        ],
      }),
    }),
    RedisModule.register({ name: REDIS_PUBSUB_CLIENT }),
    FcmModule,
    NaverModule,
    SocketIoModule,
    // TypeORM Entities
    AlarmsModule,
    AppModule,
    AuthModule,
    BannersModule,
    CareersModule,
    CategoriesModule,
    ChatsModule,
    ContentsModule,
    FeedsModule,
    IcebreakersModule,
    InquiriesModule,
    LanguagesModule,
    LedgersModule,
    MeetupsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DuplicateEntryErrorInterceptor, // 중복입력은 400으로 전환
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: SentryErrorReportFilter, // 500 이상이면 Senty로 보고
    },
    AppService,
  ],
})
export class AppModule {}
