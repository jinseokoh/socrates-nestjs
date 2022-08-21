import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { GrantsService } from 'src/domain/grants/grants.service';
@Injectable()
export class InsertDiscountPipe implements PipeTransform {
  constructor(private readonly grantsService: GrantsService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('grantId')) {
      const grant = await this.grantsService.findById(+value.grantId, [
        'coupon',
      ]);
      // coupon's validity will be checked in payments.service
      return {
        ...value,
        discount: grant.coupon.discount,
      };
    }

    return value;
  }
}
