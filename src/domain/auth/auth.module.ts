import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from 'src/domain/auth/auth.controller';
import { AuthService } from 'src/domain/auth/auth.service';
import { FirebaseStrategy } from 'src/domain/auth/strategies/firebase.strategy';
import { JwtAuthStrategy } from 'src/domain/auth/strategies/jwt-auth.strategy';
import { JwtRefreshStrategy } from 'src/domain/auth/strategies/jwt-refresh.strategy';
import { LedgersModule } from 'src/domain/ledgers/ledgers.module';
import { SecretsModule } from 'src/domain/secrets/secrets.module';
import { ProvidersModule } from 'src/domain/users/providers.module';
import { UsersModule } from 'src/domain/users/users.module';
import { SesModule } from 'src/services/aws/ses.module';
@Module({
  imports: [
    UsersModule,
    ProvidersModule,
    PassportModule,
    SecretsModule,
    LedgersModule,
    SesModule,
    // configured the details in auth service instead of configuring 'em here
    // ref) https://medium.com/a-layman/jwt-authentication-in-nestjs-refresh-jwt-with-cookie-based-token-2f6b860f7d67
    JwtModule.register({}),
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
