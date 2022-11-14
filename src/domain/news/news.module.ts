import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from 'src/domain/news/news.controller';
import { NewsService } from 'src/domain/news/news.service';
import { S3Module } from 'src/services/aws/s3.module';
import { News } from './news.entity';
@Module({
  imports: [TypeOrmModule.forFeature([News]), S3Module],
  providers: [NewsService],
  controllers: [NewsController],
})
export class NewsModule {}
