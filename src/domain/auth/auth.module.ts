import { CacheModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { JwtModule } from '@nestjs/jwt';
import * as redisStore from 'cache-manager-ioredis';
import { SesModule } from './../../services/aws/ses.module';
import { NamingModule } from './../../services/naming/naming.module';

import { PassportModule } from '@nestjs/passport';
import { AuthController } from 'src/domain/auth/auth.controller';
import { AuthService } from 'src/domain/auth/auth.service';
import { FirebaseStrategy } from 'src/domain/auth/strategies/firebase.strategy';
import { JwtAuthStrategy } from 'src/domain/auth/strategies/jwt-auth.strategy';
import { JwtRefreshStrategy } from 'src/domain/auth/strategies/jwt-refresh.strategy';
import { ProvidersModule } from 'src/domain/providers/providers.module';
import { UsersModule } from 'src/domain/users/users.module';
@Module({
  imports: [
    UsersModule,
    ProvidersModule,
    PassportModule,
    SesModule,
    NamingModule,
    JwtModule.register({}),
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
  ],
  providers: [
    AuthService,
    JwtAuthStrategy,
    JwtRefreshStrategy,
    FirebaseStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
