import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleAuctionsController } from 'src/domain/articles/article-auctions.controller';
import { ArticlesController } from 'src/domain/articles/articles.controller';
import { ArticlesService } from 'src/domain/articles/articles.service';
import { RelatedArticlesController } from 'src/domain/articles/related-articles.controller';
import { Auction } from './../auctions/auction.entity';
import { Article } from './article.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Article, Auction])],
  exports: [ArticlesService],
  providers: [ArticlesService],
  controllers: [
    ArticlesController,
    ArticleAuctionsController,
    RelatedArticlesController,
  ],
})
export class ArticlesModule {}
