import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from 'src/domain/regions/entities/region.entity';
import { RegionsController } from 'src/domain/regions/regions.controller';
import { RegionsService } from 'src/domain/regions/regions.service';
@Module({
  imports: [TypeOrmModule.forFeature([Region])],
  providers: [RegionsService],
  controllers: [RegionsController],
})
export class RegionsModule {}
