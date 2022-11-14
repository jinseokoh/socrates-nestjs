import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SlackModule, SlackOptions } from 'nestjs-slack-webhook';
import { AppController } from 'src/app.controller';

// import { SseMiddleware } from 'src/services/sse/sse.middleware';

import { getAwsDatabaseConfig } from 'src/common/config/aws-database';
import { configuration } from 'src/common/config/configuration';
import { IAwsConfig, IDatabaseConfig } from 'src/common/interfaces';
import { AuthModule } from 'src/domain/auth/auth.module';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt-auth.guard';
import { GamesModule } from 'src/domain/games/games.module';
import { SurveysModule } from 'src/domain/surveys/surveys.module';
import { UsersModule } from 'src/domain/users/users.module';
import { SseModule } from 'src/services/sse/sse.module';
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
          nodeEnv === 'local'
            ? configService.get<IDatabaseConfig>('database')
            : await getAwsDatabaseConfig(awsConfig);

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
    SlackModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<SlackOptions> => {
        return {
          url: configService.get('slack.webhookUrl'),
        };
      },
    }),
    AuthModule,
    GamesModule,
    SurveysModule,

    // ArticleCommentsModule,
    // ArticlesModule,
    // ArtistsModule,
    // ArtworksModule,
    // AuctionsModule,
    // BannersModule,
    // BidsModule,
    // ChatsModule,
    // CouponsModule,
    // DestinationsModule,
    // FollowsModule,
    // GrantsModule,
    // HashtagsModule,
    // NewsModule,
    // PaymentsModule,
    // PacksModule,
    // StocksModule,
    // StockCommentsModule,
    // ProfilesModule,
    // ProvidersModule,
    // QuestionsModule,
    // ReportsModule,
    UsersModule,
    SseModule,
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

// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(SseMiddleware).forRoutes('*');
//   }
// }
