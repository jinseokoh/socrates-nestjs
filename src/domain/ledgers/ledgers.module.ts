import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { LedgersController } from 'src/domain/ledgers/ledgers.controller';
import { LedgersService } from 'src/domain/ledgers/ledgers.service';
import { LedgerSubscriber } from 'src/domain/ledgers/subscribers/ledger-subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Ledger, User])],
  exports: [LedgersService], // it's required when using LedgersService within other services
  providers: [LedgersService, LedgerSubscriber],
  controllers: [LedgersController],
})
export class LedgersModule {}
