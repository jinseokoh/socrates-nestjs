import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Article } from 'src/domain/articles/article.entity';
import { ArticlesService } from 'src/domain/articles/articles.service';
import { SyncRelatedArticlesDto } from 'src/domain/articles/dto/sync-related-articles.dto';
@Controller('articles')
export class RelatedArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiOperation({ description: '관리자) 관련아티클 수동 일괄등록' })
  @Post(':id/articles')
  async syncRelatedArticles(
    @Param('id') id: number,
    @Body()
    dto: SyncRelatedArticlesDto,
  ): Promise<Article> {
    return await this.articlesService.syncRelatedArticles(id, dto);
  }
}
