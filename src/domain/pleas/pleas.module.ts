import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PleasController } from 'src/domain/pleas/pleas.controller';
import { PleasService } from 'src/domain/pleas/pleas.service';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Plea])],
  exports: [PleasService],
  providers: [PleasService],
  controllers: [PleasController],
})
export class PleasModule {}
