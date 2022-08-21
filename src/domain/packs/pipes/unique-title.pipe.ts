import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { PacksService } from 'src/domain/packs/packs.service';

@Injectable()
export class UniqueTitlePipe implements PipeTransform {
  constructor(private readonly packsService: PacksService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('title')) {
      const total = await this.packsService.count(value.title);
      if (total > 0) {
        throw new BadRequestException(`duplicate title exists`);
      }
    }

    return value;
  }
}
