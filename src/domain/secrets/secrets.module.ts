import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretsService } from 'src/domain/secrets/secrets.service';
import { Secret } from './entities/secret.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Secret])],
  exports: [SecretsService],
  providers: [SecretsService],
  // controllers: [SecretsController], @deprecated 미사용
})
export class SecretsModule {}
