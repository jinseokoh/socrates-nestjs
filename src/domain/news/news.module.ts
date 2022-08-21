import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from 'src/domain/news/news.controller';
import { NewsService } from 'src/domain/news/news.service';
import { News } from './news.entity';
@Module({
  imports: [TypeOrmModule.forFeature([News])],
  providers: [NewsService],
  controllers: [NewsController],
})
export class NewsModule {}
