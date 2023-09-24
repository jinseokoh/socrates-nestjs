import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ValidateInquiryIdPipe implements PipeTransform {
  constructor(
    @InjectRepository(Inquiry)
    private readonly articlesRepository: Repository<Inquiry>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // 1) check if param itself exists
    if (!value.hasOwnProperty('articleId')) {
      throw new BadRequestException(`param articleId is missing`);
    }
    // 2) check if article exists
    try {
      await this.articlesRepository.findOneOrFail(value.articleId);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }

    return value;
  }
}
