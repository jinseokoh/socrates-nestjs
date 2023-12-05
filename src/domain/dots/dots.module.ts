import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DotsController } from 'src/domain/dots/dots.controller';
import { DotsService } from 'src/domain/dots/dots.service';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Connection } from 'src/domain/users/entities/connection.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Dot, Connection])],
  providers: [DotsService],
  controllers: [DotsController],
})
export class DotsModule {}
