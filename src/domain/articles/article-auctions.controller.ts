import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { NumberData } from 'src/common/types/number-data.type';
import { Article } from 'src/domain/articles/article.entity';
import { ArticlesService } from 'src/domain/articles/articles.service';
import { SyncArticleAuctionsDto } from 'src/domain/articles/dto/sync-article-auctions.dto';
@Controller('articles')
export class ArticleAuctionsController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiOperation({ description: '관리자) 아티클 옥션 일괄등록' })
  @Post(':id/auctions')
  async sync(
    @Param('id') id: number,
    @Body()
    dto: SyncArticleAuctionsDto,
  ): Promise<Article> {
    return await this.articlesService.syncArticleAuctions(id, dto);
  }

  @ApiOperation({ description: '옥션 관심사용자 추가' })
  @Put(':articleId/artworks/:auctionId')
  async attach(
    @Param('articleId') articleId: number,
    @Param('auctionId') auctionId: number,
  ): Promise<NumberData> {
    const { affectedRows } = await this.articlesService.attach(
      articleId,
      auctionId,
    );
    return { data: affectedRows };
  }

  @ApiOperation({ description: '옥션 관심사용자 추가' })
  @Delete(':articleId/artworks/:auctionId')
  async detach(
    @Param('articleId') articleId: number,
    @Param('auctionId') auctionId: number,
  ): Promise<NumberData> {
    const { affectedRows } = await this.articlesService.detach(
      articleId,
      auctionId,
    );
    return { data: affectedRows };
  }
}
