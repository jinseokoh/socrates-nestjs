import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ExtractCategoriesPipe implements PipeTransform {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('category')) {
      const category = await this.repository.findOne({
        where: {
          id: value.category,
        },
      });
      const tree = await this.repository.manager
        .getTreeRepository(Category)
        .findAncestorsTree(category);

      console.log(category, tree);
    }

    return value;
  }
}
