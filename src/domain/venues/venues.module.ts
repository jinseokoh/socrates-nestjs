import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/venues/entities/category.entity';
import { VenuesController } from 'src/domain/venues/venues.controller';
import { VenuesService } from 'src/domain/venues/venues.service';
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [VenuesService],
  controllers: [VenuesController],
})
export class VenuesModule {}
