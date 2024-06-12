import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactionsController } from 'src/domain/factions/factions.controller';
import { FactionsService } from 'src/domain/factions/factions.service';
import { Faction } from 'src/domain/factions/entities/faction.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Faction])],
  providers: [FactionsService],
  controllers: [FactionsController],
})
export class FactionsModule {}
