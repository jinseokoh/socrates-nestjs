import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from 'src/domain/articles/articles.controller';
import { ArticlesService } from 'src/domain/articles/articles.service';
import { S3Module } from 'src/services/aws/s3.module';
import { Auction } from './../auctions/auction.entity';
import { Article } from './article.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Article, Auction]), S3Module],
  exports: [ArticlesService],
  providers: [ArticlesService],
  controllers: [ArticlesController],
})
export class ArticlesModule {}
