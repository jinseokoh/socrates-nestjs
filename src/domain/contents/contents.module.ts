import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entities/content.entity';
import { ContentsController } from 'src/domain/contents/contents.controller';
import { ContentsService } from 'src/domain/contents/contents.service';
@Module({
  imports: [TypeOrmModule.forFeature([Content])],
  providers: [ContentsService],
  controllers: [ContentsController],
})
export class ContentsModule {}
