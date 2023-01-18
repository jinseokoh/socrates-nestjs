import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from 'src/app.controller';

import { getAwsDatabaseConfig } from 'src/common/config/aws-database';
import { configuration } from 'src/common/config/configuration';
import { IAwsConfig, IDatabaseConfig } from 'src/common/interfaces';
import { AuthModule } from 'src/domain/auth/auth.module';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt-auth.guard';
import { GameResultsModule } from 'src/domain/game-results/game-results.module';
import { GamesModule } from 'src/domain/games/games.module';
import { MessagesModule } from 'src/domain/messages/messages.module';
import { SurveysModule } from 'src/domain/surveys/surveys.module';
import { UsersModule } from 'src/domain/users/users.module';
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
    AuthModule,
    GamesModule,
    GameResultsModule,
    SurveysModule,
    UsersModule,
    MessagesModule,
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
