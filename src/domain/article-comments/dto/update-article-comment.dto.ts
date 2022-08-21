import { PartialType } from '@nestjs/swagger';
import { CreateArticleCommentDto } from 'src/domain/article-comments/dto/create-article-comment.dto';
export class UpdateArticleCommentDto extends PartialType(
  CreateArticleCommentDto,
) {}
