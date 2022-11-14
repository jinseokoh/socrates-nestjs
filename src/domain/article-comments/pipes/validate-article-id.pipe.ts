import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from 'src/domain/articles/article.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ValidateArticleIdPipe implements PipeTransform {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // 1) check if param itself exists
    if (!value.hasOwnProperty('articleId')) {
      throw new BadRequestException(`param articleId is missing`);
    }
    // 2) check if article exists
    await this.articlesRepository.findOneOrFail(value.articleId);

    return value;
  }
}
