import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Grant } from 'src/domain/grants/grant.entity';
import { Repository } from 'typeorm';
@Injectable()
export class InsertDiscountPipe implements PipeTransform {
  constructor(
    @InjectRepository(Grant)
    private readonly grantsRepository: Repository<Grant>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('grantId')) {
      const grant = await this.grantsRepository.findOneOrFail({
        where: { id: +value.grantId },
        relations: ['coupon'],
      });
      // coupon's validity will be checked in payments.service
      return {
        ...value,
        discount: grant.coupon.discount,
      };
    }

    return value;
  }
}
