import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ArticlesService } from 'src/domain/articles/articles.service';
@Injectable()
export class ValidateArticleIdPipe implements PipeTransform {
  constructor(private readonly articlesService: ArticlesService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // 1) if param itself exists
    if (!value.hasOwnProperty('articleId')) {
      throw new BadRequestException(`articleId is missing`);
    }

    // 2) if article exists
    await this.articlesService.findById(value.articleId);

    return value;
  }
}
