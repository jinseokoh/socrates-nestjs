import { PartialType } from '@nestjs/swagger';
import {
  CreateArticleDto,
  CreateArticleDtoWithArticeAuctionsDtoArticleArticlesDto,
} from 'src/domain/articles/dto/create-article.dto';
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
export class UpdateArticleDtoWithArticeAuctionsDtoArticleArticlesDto extends PartialType(
  CreateArticleDtoWithArticeAuctionsDtoArticleArticlesDto,
) {}
