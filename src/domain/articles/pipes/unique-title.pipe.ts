import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ArticlesService } from 'src/domain/articles/articles.service';
@Injectable()
export class UniqueTitlePipe implements PipeTransform {
  constructor(private readonly articlesService: ArticlesService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('title')) {
      const total = await this.articlesService.count(value.title);
      if (total > 0) {
        throw new BadRequestException(`duplicate title exists`);
      }
    }

    return value;
  }
}
