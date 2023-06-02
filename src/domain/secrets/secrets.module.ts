import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretsController } from 'src/domain/secrets/secrets.controller';
import { SecretsService } from 'src/domain/secrets/secrets.service';
import { Secret } from './secret.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Secret])],
  exports: [SecretsService],
  providers: [SecretsService],
  controllers: [SecretsController],
})
export class SecretsModule {}
