import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareersController } from 'src/domain/careers/careers.controller';
import { CareersService } from 'src/domain/careers/careers.service';
import { Career } from 'src/domain/careers/entities/career.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Career])],
  providers: [CareersService],
  controllers: [CareersController],
})
export class CareersModule {}
