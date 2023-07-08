import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from 'src/app.controller';
import * as redisStore from 'cache-manager-ioredis';
import { DynamooseModule } from 'nestjs-dynamoose';
import { getAwsDatabaseConfig } from 'src/common/config/aws-database';
import { configuration } from 'src/common/config/configuration';
import { IAwsConfig, IDatabaseConfig } from 'src/common/interfaces';
import { AuthModule } from 'src/domain/auth/auth.module';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt-auth.guard';
import { CareersModule } from 'src/domain/careers/careers.module';
import { CategoriesModule } from 'src/domain/categories/categories.module';
import { ContentsModule } from 'src/domain/contents/contents.module';
import { MessagesModule } from 'src/domain/chats/messages.module';
import { MeetupsModule } from 'src/domain/meetups/meetups.module';
import { RoomsModule } from 'src/domain/rooms/rooms.module';
import { UsersModule } from 'src/domain/users/users.module';
import { NaverModule } from 'src/services/naver/naver.module';
import { CacheModule } from '@nestjs/cache-manager';
import { QuestionsModule } from 'src/domain/questions/questions.module';
import { CommentsModule } from 'src/domain/comments/comments.module';
import { RedisModule } from 'src/services/redis/redis.module';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        const nodeEnv = configService.get<string>('nodeEnv');
        const awsConfig = configService.get<IAwsConfig>('aws');
        const databaseConfig =
          nodeEnv === 'prod'
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
          synchronize: true,
          timezone: 'Z',
          bigNumberStrings: true,
          logging: true,
          migrations: ['dist/migrations/**/*{.ts,.js}'],
          cli: {
            migrationsDir: 'dist/migrations',
          },
        } as TypeOrmModuleOptions;
      },
    }),
    DynamooseModule.forRoot({
      local: process.env.NODE_ENV === 'local',
      aws: {
        region: process.env.AWS_DEFAULT_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      table: {
        create: process.env.NODE_ENV === 'local',
        prefix: `${process.env.NODE_ENV}-`,
        suffix: '-table',
      },
    }),
    // CacheModule.register(),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        db: 0,
        ttl: 60 * 3, // default to 3 mins
      }),
    }),
    NaverModule,
    AuthModule,
    RoomsModule,
    CategoriesModule,
    CareersModule,
    ContentsModule,
    MeetupsModule,
    MessagesModule,
    QuestionsModule,
    CommentsModule,
    UsersModule,
    RedisModule.register({ name: REDIS_PUBSUB_CLIENT }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
