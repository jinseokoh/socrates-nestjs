import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { LedgersController } from 'src/domain/ledgers/ledgers.controller';
import { LedgersService } from 'src/domain/ledgers/ledgers.service';
@Module({
  imports: [TypeOrmModule.forFeature([Ledger, User])],
  // exports: [LedgersService], // we need this for what?
  providers: [LedgersService],
  controllers: [LedgersController],
})
export class LedgersModule {}
