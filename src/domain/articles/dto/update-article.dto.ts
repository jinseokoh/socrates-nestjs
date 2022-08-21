import { PartialType } from '@nestjs/swagger';
import { CreateArticleDto } from 'src/domain/articles/dto/create-article.dto';
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
