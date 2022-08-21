import { Resource } from '@adminjs/typeorm';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { SlackModule, SlackOptions } from 'nestjs-slack-webhook';
import { AppController } from 'src/app.controller';

// import { SseMiddleware } from 'src/services/sse/sse.middleware';

import { getAwsDatabaseConfig } from 'src/common/config/aws-database';
import { configuration } from 'src/common/config/configuration';
import { IAwsConfig, IDatabaseConfig } from 'src/common/interfaces';
import { ArticleCommentsModule } from 'src/domain/article-comments/article-comments.module';
import { ArticlesModule } from 'src/domain/articles/articles.module';
import { ArtistsModule } from 'src/domain/artists/artists.module';
import { ArtworksModule } from 'src/domain/artworks/artworks.module';
import { AuctionsModule } from 'src/domain/auctions/auctions.module';
import { AuthModule } from 'src/domain/auth/auth.module';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt-auth.guard';
import { BidsModule } from 'src/domain/bids/bids.module';
import { ChatsModule } from 'src/domain/chats/chats.module';
import { CouponsModule } from 'src/domain/coupons/coupons.module';
import { DestinationsModule } from 'src/domain/destinations/destinations.module';
import { FollowsModule } from 'src/domain/follows/follows.module';
import { GrantsModule } from 'src/domain/grants/grants.module';
import { HashtagsModule } from 'src/domain/hashtags/hashtags.module';
import { NewsModule } from 'src/domain/news/news.module';
import { PacksModule } from 'src/domain/packs/packs.module';
import { PaymentsModule } from 'src/domain/payments/payments.module';
import { PostCommentsModule } from 'src/domain/post-comments/post-comments.module';
import { PostsModule } from 'src/domain/posts/posts.module';
import { ProfilesModule } from 'src/domain/profiles/profiles.module';
import { ProvidersModule } from 'src/domain/providers/providers.module';
import { QuestionsModule } from 'src/domain/questions/questions.module';
import { UsersModule } from 'src/domain/users/users.module';
import { SseModule } from 'src/services/sse/sse.module';

Resource.validate = validate;

// AdminJS.registerAdapter({ Database, Resource });
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
    ArticleCommentsModule,
    ArticlesModule,
    ArtistsModule,
    ArtworksModule,
    AuctionsModule,
    BidsModule,
    ChatsModule,
    CouponsModule,
    DestinationsModule,
    FollowsModule,
    GrantsModule,
    HashtagsModule,
    NewsModule,
    PaymentsModule,
    PacksModule,
    PostCommentsModule,
    PostsModule,
    ProfilesModule,
    ProvidersModule,
    QuestionsModule,
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
